from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    DEMO_ORG_ID: str = "00000000-0000-0000-0000-000000000002"

    class Config:
        env_file = ".env"


settings = Settings()
