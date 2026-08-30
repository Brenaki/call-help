"""JWT e hash de senha."""

from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from backend.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)


def verificar_senha(senha: str, hash_salvo: str) -> bool:
    return pwd_context.verify(senha, hash_salvo)


def criar_jwt(subject: str, role: str) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "role": role, "exp": expira}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decodificar_jwt(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except Exception:
        return None