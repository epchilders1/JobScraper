import logging
import numpy as np
from openai import AsyncOpenAI
from config import Config
import json

logger = logging.getLogger(__name__)
openai_client = AsyncOpenAI(api_key=Config.OPENAI_API_KEY)


async def get_text_embedding(text: str) -> np.ndarray:
    """
    Get OpenAI embedding for the given text
    """
    if not text or not isinstance(text, str):
        return np.zeros(Config.EMBEDDING_DIMENSION)

    try:
        response = await openai_client.embeddings.create(
            model=Config.EMBEDDING_MODEL,
            input=text
        )
        embedding = np.array(response.data[0].embedding)
        return embedding
    except Exception as e:
        logger.error(f"Error getting OpenAI embedding: {e}")
        return np.zeros(Config.EMBEDDING_DIMENSION)


def build_resume_embedding_input(raw_text: str, skills: list[str]) -> str:
    parts = []
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")
    parts.append(raw_text)
    return "\n".join(parts)


def build_job_embedding_input(job: dict) -> str:
    parts = [
        f"{job['title']} {job['title']} {job['title']}",
        f"Company: {job['company']}",
        f"Skills: {', '.join(job.get('extracted_skills', []))}",
        f"Description: {job['description']}",
    ]
    return "\n".join(p for p in parts if p)

async def extract_skills(resume_text: str) -> list[str]:
      response = await openai_client.chat.completions.create(
          model=Config.MODEL,
          response_format={"type": "json_object"},
          messages=[
              {
                  "role": "system",
                  "content": (
                      "You are a recruiter. Extract a deduplicated list of"
                      "skills from the resume text. Include programming languages, frameworks, "
                      "tools, platforms, and methodologies. Return JSON: {\"skills\": [\"...\"]}"
                  ),
              },
              {"role": "user", "content": resume_text},
          ],
          temperature=0,
      )
      content = response.choices[0].message.content or "{}"
      return json.loads(content).get("skills", [])