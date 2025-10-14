# กำหนดค่า JWT (SECRET_KEY, ALGORITHM)
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # JWT Settings
    SECRET_KEY: str = "your-jwt-secret-key-that-should-be-in-env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Database Settings (FastAPI/SQLAlchemy standard)
    DATABASE_URL: str = "sqlite:///./bus_tracking.db"

settings = Settings()