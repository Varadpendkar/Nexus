import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NEXUS API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    NOTIFICATION_EMAIL: str = os.getenv("NOTIFICATION_EMAIL", "team@nexusagency.dev")
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
