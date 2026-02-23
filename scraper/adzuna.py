import asyncio
import os
import time
import requests
from dataclasses import dataclass, field
from typing import Optional
from dotenv import load_dotenv

from embeddings import build_job_embedding_input, get_text_embedding

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

APP_ID = os.getenv("ADZUNA_APPLICATION_ID")
APP_KEY = os.getenv("ADZUNA_APPLICATION_KEY")
BASE_URL = "https://api.adzuna.com/v1/api/jobs"


@dataclass
class Job:
    id: str
    title: str
    company: str
    location: str
    description: str
    url: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_is_predicted: bool = False
    contract_time: Optional[str] = None
    category: Optional[str] = None
    location_area: Optional[list[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created: Optional[str] = None
    embedding: list[float] = field(default_factory=list)


def search_jobs(
    what: str = "",
    what_phrase: str = "",
    where: str = "",
    country: str = "us",
    results_per_page: int = 10,
    start_page: int = 1,
    max_pages: int = 1,
    sort_by: str = "date",
    full_time: bool = False,
    salary_min: Optional[int] = None,
) -> list[Job]:
    """
    Search Adzuna for jobs.

    Args:
        what: All words must appear (AND logic).
        what_phrase: Exact phrase match — use this for precise job title searches.
        where: Location string (city, state, etc.).
        country: Two-letter country code (default "us").
        results_per_page: Results per API page (max 50).
        max_pages: How many pages to fetch.
        sort_by: "date" | "salary" | "relevance".
        full_time: If True, restrict to full-time postings.
        salary_min: Minimum advertised salary filter.

    Returns:
        List of Job dataclass instances.
    """
    if not APP_ID or not APP_KEY:
        raise ValueError("ADZUNA_APPLICATION_ID and ADZUNA_APPLICATION_KEY must be set in .env")
    if not what and not what_phrase:
        raise ValueError("Provide at least one of: what, what_phrase")

    jobs: list[Job] = []

    for page in range(start_page, start_page + max_pages):
        url = f"{BASE_URL}/{country}/search/{page}"
        params: dict = {
            "app_id": APP_ID,
            "app_key": APP_KEY,
            "results_per_page": results_per_page,
            "content-type": "application/json",
            "sort_by": sort_by,
        }
        if what:
            params["what"] = what
        if what_phrase:
            params["what_phrase"] = what_phrase
        if where:
            params["where"] = where
        if full_time:
            params["full_time"] = 1
        if salary_min is not None:
            params["salary_min"] = salary_min

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        results = data.get("results", [])
        if not results:
            break

        for r in results:
            job = Job(
                id=r.get("id", ""),
                title=r.get("title", ""),
                company=r.get("company", {}).get("display_name", "Unknown"),
                location=r.get("location", {}).get("display_name", ""),
                description=r.get("description", ""),
                url=r.get("redirect_url", ""),
                salary_min=r.get("salary_min"),
                salary_max=r.get("salary_max"),
                salary_is_predicted=r.get("salary_is_predicted") == "1",
                contract_time=r.get("contract_time"),
                category=r.get("category", {}).get("label"),
                location_area=r.get("location", {}).get("area"),
                latitude=r.get("latitude"),
                longitude=r.get("longitude"),
                created=r.get("created"),
            )
            jobs.append(job)

        if page < max_pages:
            time.sleep(0.5)

    return jobs


async def search_multiple(
    titles: list[str],
    where: list[str],
    country: str = "us",
    results_per_page: int = 10,
    page: int = 1,
    max_pages: int = 1,
    sort_by: str = "date",
    full_time: bool = False,
    salary_min: Optional[int] = None,
) -> list[Job]:
    """
    Search Adzuna for multiple job titles, deduplicating results by job ID.

    Args:
        titles: List of exact job title phrases to search for.
        (remaining args are passed through to search_jobs)

    Returns:
        Deduplicated list of Job instances across all title queries.
    """
    seen: set[str] = set()
    all_jobs: list[Job] = []

    for title in titles:
        for location in where:
            print(f"  Searching: '{title}'...")
            jobs = search_jobs(
                what=title,
                where=location,
                country=country,
                results_per_page=results_per_page,
                start_page=page,
                max_pages=max_pages,
                sort_by=sort_by,
                full_time=full_time,
                salary_min=salary_min,
            )
            new = [j for j in jobs if j.id not in seen]
            seen.update(j.id for j in new)
            all_jobs.extend(new)
            print(f"    {len(new)} new result(s) ({len(jobs) - len(new)} duplicate(s) skipped)")

            if new:
                embeddings = await asyncio.gather(*[
                    get_text_embedding(build_job_embedding_input(j.__dict__))
                    for j in new
                ])
                for job, emb in zip(new, embeddings):
                    job.embedding = emb.tolist()

            if title != titles[-1]:
                time.sleep(0.5)

    return all_jobs
