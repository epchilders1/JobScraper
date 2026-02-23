import logging
from datetime import datetime, timedelta, timezone
from generated.prisma import Prisma
from adzuna import Job

logger = logging.getLogger(__name__)


async def get_db_connection() -> Prisma:
    db = Prisma()
    await db.connect()
    return db


async def close_db_connection(db: Prisma) -> None:
    if db:
        await db.disconnect()


async def get_all_jobs(db: Prisma) -> list[Job]:
    """Fetch all non-expired jobs from the DB as Job instances, newest first."""
    rows = await db.job.find_many(
        where={"expiresAt": {"gt": datetime.now(timezone.utc)}},
        order={"postedAt": "desc"},
        take=500,
    )
    jobs = []
    for row in rows:
        jobs.append(Job(
            id=row.externalId,
            title=row.title,
            company=row.company,
            location=row.location,
            description=row.description or "",
            url=row.applyUrl or "",
            salary_min=float(row.salaryMin) if row.salaryMin is not None else None,
            salary_max=float(row.salaryMax) if row.salaryMax is not None else None,
            contract_time=row.jobType,
            created=row.postedAt.isoformat() if row.postedAt else None,
            embedding=row.embedding or [],
        ))
    return jobs


async def get_existing_jobs(db: Prisma, external_ids: list[str]) -> dict[str, list[float]]:
    """Returns {externalId: embedding} for jobs already in the database."""
    rows = await db.job.find_many(where={"externalId": {"in": external_ids}})
    return {row.externalId: row.embedding for row in rows}


async def upsert_jobs(db: Prisma, jobs: list[Job]) -> None:
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    for job in jobs:
        await db.job.upsert(
            where={"externalId": job.id},
            data={
                "create": {
                    "externalId": job.id,
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "description": job.description,
                    "applyUrl": job.url,
                    "salaryMin": int(job.salary_min) if job.salary_min else None,
                    "salaryMax": int(job.salary_max) if job.salary_max else None,
                    "jobType": job.contract_time,
                    "embedding": job.embedding,
                    "source": "adzuna",
                    "postedAt": job.created,
                    "expiresAt": expires_at,
                },
                "update": {
                    "embedding": job.embedding,
                    "expiresAt": expires_at,
                },
            },
        )
