"""Configurações do backend lidas do ambiente."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "mysql+aiomysql://callhelp:callhelppass@db:3306/call_help"
    jwt_secret: str = "muda-esse-segredo-em-producao"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120


settings = Settings()