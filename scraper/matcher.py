import math
import numpy as np
from adzuna import Job


def calculate_cosine_similarity(vector_1: np.ndarray, vector_2: np.ndarray) -> float:
    norm1 = np.linalg.norm(vector_1)
    norm2 = np.linalg.norm(vector_2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.clip(np.dot(vector_1, vector_2) / (norm1 * norm2), -1.0, 1.0))


def similarity_to_percentage(similarity_score: float) -> float:
    similarity_score = max(-1.0, min(1.0, similarity_score))
    return round((math.pi - math.acos(similarity_score)) * 100 / math.pi, 2)


def score_job(job: Job, resume_embedding: list[float]) -> float:
    if not job.embedding or not resume_embedding:
        return 0.0
    return calculate_cosine_similarity(
        np.array(job.embedding, dtype=float),
        np.array(resume_embedding, dtype=float),
    )


def rank_jobs(jobs: list[Job], resume_embedding: list[float]) -> list[tuple[Job, float]]:
    scored = [(job, score_job(job, resume_embedding)) for job in jobs]
    return sorted(scored, key=lambda x: x[1], reverse=True)
