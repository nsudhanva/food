from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    database_url: str = "postgresql://food:food@localhost:5432/food"
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    chroma_collection: str = "foods"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8080
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
