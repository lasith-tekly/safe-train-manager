import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = None
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URL:
            # Use absolute path for SQLite database
            BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            DB_PATH = os.path.join(BASE_DIR, "safe_train.db")
            self.DATABASE_URL = f"sqlite:///{DB_PATH}"


settings = Settings()
