from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    DEMO_ORG_ID: str = "00000000-0000-0000-0000-000000000002"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
