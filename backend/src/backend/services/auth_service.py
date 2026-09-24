"""Service de autenticação - regras de login."""

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.user import User
from backend.repositories.user_repo import UserRepository
from backend.security import criar_jwt, verificar_senha


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def login(self, email: str, senha: str) -> dict | None:
        user = await self.user_repo.get_by_email(email)
        if user is None:
            return None
        if not verificar_senha(senha, user.password_hash):
            return None
        token = criar_jwt(str(user.id), user.role)
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user.role,
            "user_id": user.id,
            "name": user.name,
            "must_change_password": user.must_change_password,
        }
