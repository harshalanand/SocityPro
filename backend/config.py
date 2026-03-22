from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "SocietyPro"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "societypro-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    DB_TYPE: str = "sqlite"
    SQLITE_PATH: str = "./societypro.db"
    MSSQL_SERVER: Optional[str] = None
    MSSQL_DATABASE: Optional[str] = None
    MSSQL_USERNAME: Optional[str] = None
    MSSQL_PASSWORD: Optional[str] = None
    MSSQL_DRIVER: str = "ODBC Driver 17 for SQL Server"

    # SMS / Twilio
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_FROM_NUMBER: Optional[str] = None
    MSG91_AUTH_KEY: Optional[str] = None

    # Email
    SENDGRID_API_KEY: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@societypro.com"

    # WhatsApp
    WHATSAPP_FROM: Optional[str] = None
    WATI_API_ENDPOINT: Optional[str] = None
    WATI_ACCESS_TOKEN: Optional[str] = None

    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"

settings = Settings()

def get_database_url() -> str:
    if settings.DB_TYPE == "mssql":
        return (
            f"mssql+pyodbc://{settings.MSSQL_USERNAME}:{settings.MSSQL_PASSWORD}"
            f"@{settings.MSSQL_SERVER}/{settings.MSSQL_DATABASE}"
            f"?driver={settings.MSSQL_DRIVER.replace(' ', '+')}"
        )
    return f"sqlite:///{settings.SQLITE_PATH}"
