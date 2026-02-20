import os
import secrets
from dotenv import load_dotenv

load_dotenv()

class Config:
    
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    EMBEDDING_MODEL = "text-embedding-3-small"
    EMBEDDING_DIMENSION = 1536,
    MODEL = "gpt-4o-mini"