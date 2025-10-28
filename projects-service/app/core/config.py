from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database - используем общую postgres-db
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres-db:5432/postgres-db"
    
    # Services URLs
    FILES_SERVICE_URL: str = "http://files-service:8006"
    AUTH_SERVICE_URL: str = "http://auth-service:8002"
    
    class Config:
        env_file = ".env"

def get_settings() -> Settings:
    return Settings()

