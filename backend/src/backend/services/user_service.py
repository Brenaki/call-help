"""Service de usuários - regras de negócio."""

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.user import User
from backend.repositories.user_repo import UserRepository
from backend.schemas.user import UserCreate, UserUpdate
from backend.security import hash_senha


class UserService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def list_all(self) -> list[User]:
        return await self.user_repo.list_all()

    async def get_by_id(self, user_id: int) -> User | None:
        return await self.user_repo.get_by_id(user_id)

    async def create(self, dados: UserCreate) -> User:
        user = User(
            name=dados.name,
            email=dados.email,
            password_hash=hash_senha(dados.password),
            role=dados.role,
            sector=dados.sector,
        )
        return await self.user_repo.create(user)

    async def update(self, user_id: int, dados: UserUpdate) -> User | None:
        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            return None
        if dados.name is not None:
            user.name = dados.name
        if dados.email is not None:
            user.email = dados.email
        if dados.password is not None:
            user.password_hash = hash_senha(dados.password)
        if dados.role is not None:
            user.role = dados.role
        if dados.sector is not None:
            user.sector = dados.sector
        return await self.user_repo.update(user)

    async def delete(self, user_id: int) -> bool:
        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            return False
        await self.user_repo.delete(user)
        return True