import asyncio
import logging
import math
import io

from flask import Flask, request, jsonify
import pdfplumber

from adzuna import Job, search_multiple
from db import get_db_connection, close_db_connection, upsert_jobs, get_existing_jobs, get_all_jobs
from embeddings import get_text_embedding, extract_skills, build_resume_embedding_input, build_job_embedding_input
from matcher import rank_jobs

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)


def _job_to_dict(job: Job) -> dict:
    return {
        "id":           job.id,
        "title":        job.title,
        "company":      job.company,
        "location":     job.location,
        "description":  job.description,
        "url":          job.url,
        "salaryMin":    job.salary_min,
        "salaryMax":    job.salary_max,
        "contractTime": job.contract_time,
        "created":      job.created,
    }


@app.route("/parse_resume", methods=["POST"])
def parse_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["resume"]

    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "File must be a PDF"}), 400

    try:
        pdf_bytes = file.read()
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            raw_text = "\n".join(
                page.extract_text() for page in pdf.pages
                if page.extract_text()
            )
    except Exception as e:
        return jsonify({"error": f"Failed to extract text: {str(e)}"}), 422

    if not raw_text.strip():
        return jsonify({"error": "Could not extract text from PDF"}), 422

    async def _process():
        skills = await extract_skills(raw_text)
        embedding = await get_text_embedding(build_resume_embedding_input(raw_text, skills))
        return embedding, skills

    embedding, skills = asyncio.run(_process())
    return jsonify({
        "rawText":   raw_text,
        "skills":    skills,
        "embedding": embedding.tolist(),
    })


@app.route("/get_jobs", methods=["POST"])
def get_jobs():
    data = request.get_json(silent=True)
    if not data:
        app.logger.error("get_jobs: no JSON body. Content-Type=%s body=%r",
                         request.content_type, request.data[:200])
        return jsonify({"error": "No JSON body"}), 400

    app.logger.info("get_jobs: received keys=%s", list(data.keys()))

    target_titles    = data.get("targetTitles") or []
    preferred_cities = data.get("preferredCities") or []
    resume_embedding = data.get("resumeEmbedding")
    min_salary       = data.get("minSalary")
    min_match_score  = data.get("minMatchScore")  # 0–100
    required_keywords = [k.lower() for k in (data.get("requiredKeywords") or [])]
    excluded_keywords = [k.lower() for k in (data.get("excludedKeywords") or [])]
    job_types        = data.get("jobTypes") or []
    page             = int(data.get("page", 1))

    if not target_titles:
        app.logger.error("get_jobs: targetTitles is empty. Full payload: %s", data)
        return jsonify({"error": "No target titles configured in profile — add titles on your profile page"}), 400

    locations  = preferred_cities if preferred_cities else [""]
    num_queries = len(target_titles) * len(locations)
    per_query   = max(1, math.ceil(20 / num_queries))
    full_time   = "full-time" in job_types


    def _title_keywords(title: str) -> set[str]:
        return {w.lower() for w in title.split() if len(w) >= 4}

    target_keywords: set[str] = set()
    for t in target_titles:
        target_keywords |= _title_keywords(t)

    def title_is_relevant(job: Job) -> bool:
        return bool(_title_keywords(job.title) & target_keywords)

    def passes_filters(job: Job) -> bool:
        # Check both title and description so excluded words are caught wherever they appear
        searchable = (job.title + " " + job.description).lower()
        if required_keywords and not all(kw in searchable for kw in required_keywords):
            return False
        if excluded_keywords and any(kw in searchable for kw in excluded_keywords):
            return False
        return True

    threshold = (min_match_score / 100.0) if min_match_score is not None else 0.40


    async def _fetch_page(fetch_page: int) -> tuple[int, list[Job]]:
        """Fetch one page from Adzuna, filter, embed only new qualifying jobs.

        Returns (raw_count, jobs) where:
        - raw_count: total jobs Adzuna returned (0 means stop paginating)
        - jobs: jobs that are new to the DB, pass title/keyword filters, and are
                not duplicates within this request — embedded and ready to score
        """
        adzuna_jobs = await search_multiple(
            titles=target_titles,
            where=locations,
            results_per_page=per_query,
            page=fetch_page,
            full_time=full_time,
            salary_min=min_salary,
        )
        raw_count = len(adzuna_jobs)
        if not adzuna_jobs:
            return 0, []

        # Within-request dedup: mark all adzuna IDs seen (even unfiltered ones)
        # so later pages don't re-process them
        fresh = [j for j in adzuna_jobs if j.id not in seen_ids]
        seen_ids.update(j.id for j in adzuna_jobs)

        if not fresh:
            return raw_count, []

        filtered = [j for j in fresh if title_is_relevant(j) and passes_filters(j)]
        if not filtered:
            return raw_count, []

        db = await get_db_connection()
        try:
            external_ids = [j.id for j in filtered]
            existing = await get_existing_jobs(db, external_ids)

            # Only embed and return jobs not already in DB (truly new across requests)
            new_jobs = [j for j in filtered if j.id not in existing]
            if new_jobs:
                embeddings = await asyncio.gather(*[
                    get_text_embedding(build_job_embedding_input(j.__dict__))
                    for j in new_jobs
                ])
                for j, emb in zip(new_jobs, embeddings):
                    j.embedding = emb.tolist()
                await upsert_jobs(db, new_jobs)
        finally:
            await close_db_connection(db)

        return raw_count, new_jobs

    TARGET      = 20
    MAX_RETRIES = 10
    valid_scored: list[tuple[Job, float | None]] = []
    seen_ids: set[str] = set()
    current_page = page
    adzuna_attempts = 0

    async def _load_db_candidates() -> list[Job]:
        db = await get_db_connection()
        try:
            return await get_all_jobs(db)
        finally:
            await close_db_connection(db)

    db_all = asyncio.run(_load_db_candidates())
    db_filtered = [j for j in db_all if title_is_relevant(j) and passes_filters(j)]
    # Mark all DB ids seen so _fetch_page skips them during Phase 2
    seen_ids.update(j.id for j in db_all)

    if resume_embedding and db_filtered:
        db_scored = [(j, s) for j, s in rank_jobs(db_filtered, resume_embedding) if s >= threshold]
        valid_scored.extend(db_scored)
    elif not resume_embedding:
        valid_scored.extend((j, None) for j in db_filtered)

    app.logger.info(
        "get_jobs: DB phase — %d stored, %d passed filters, %d scored",
        len(db_all), len(db_filtered), len(valid_scored),
    )

    for attempt in range(MAX_RETRIES):
        if len(valid_scored) >= TARGET:
            break

        adzuna_attempts += 1
        raw_count, batch = asyncio.run(_fetch_page(current_page))

        if raw_count == 0:
            app.logger.info("get_jobs: Adzuna returned no results on page %d, stopping.", current_page)
            break

        app.logger.info(
            "get_jobs: Adzuna attempt %d (page %d) — %d fetched, %d new after dedup+filters, need %d more",
            adzuna_attempts, current_page, raw_count, len(batch), max(0, TARGET - len(valid_scored)),
        )

        if resume_embedding and batch:
            scored = [(j, s) for j, s in rank_jobs(batch, resume_embedding) if s >= threshold]
            valid_scored.extend(scored)
        elif not resume_embedding:
            valid_scored.extend((j, None) for j in batch)

        current_page += 1

    if resume_embedding:
        top = sorted(valid_scored, key=lambda x: x[1], reverse=True)[:TARGET]
        result = [{**_job_to_dict(j), "matchScore": round(s * 100, 1)} for j, s in top]
    else:
        result = [_job_to_dict(j) for j, _ in valid_scored[:TARGET]]

    app.logger.info(
        "get_jobs: returning %d jobs (%d from DB, %d Adzuna page(s) fetched).",
        len(result), len(db_filtered), adzuna_attempts,
    )
    return jsonify(result)


if __name__ == "__main__":
    app.run(port=5001)
