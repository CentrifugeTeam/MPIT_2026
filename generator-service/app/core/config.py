from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Service Info
    SERVICE_NAME: str = "generator-service"
    LOG_LEVEL: str = "INFO"
    
    # Service URLs
    PROJECTS_SERVICE_URL: str = "http://projects-service:8000"
    FILES_SERVICE_URL: str = "http://files-service:8000"
    
    # Mapper Configuration
    MIN_CONFIDENCE_SCORE: float = 0.5
    AUTO_MAP_THRESHOLD: float = 0.7
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

