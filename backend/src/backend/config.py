"""Configurações do backend lidas do ambiente."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "mysql+aiomysql://callhelp:callhelppass@db:3306/call_help"
    jwt_secret: str = "muda-esse-segredo-em-producao"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120

    # storage de anexos: "local" hoje, "s3" reservado para o futuro
    storage_backend: str = "local"
    upload_dir: str = "./uploads"
    max_upload_mb: int = 5
    # reservado para S3 (nao usado ainda)
    s3_bucket: str = ""
    s3_endpoint: str = ""
    s3_region: str = ""

    # seed de admin no startup
    admin_email: str = "admin@escola.edu"
    admin_password: str = "123456"
    default_user_password: str = "123456"


settings = Settings()
