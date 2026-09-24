"""Seed de admin no startup."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import settings
from backend.models.user import User
from backend.security import hash_senha


async def seed_admin(db: AsyncSession) -> None:
    """Cria o usuário admin padrão se não existir nenhum admin."""
    result = await db.execute(select(User).where(User.role == "admin"))
    if result.scalar_one_or_none() is not None:
        return

    result = await db.execute(select(User).where(User.email == settings.admin_email))
    if result.scalar_one_or_none() is not None:
        return

    db.add(
        User(
            name="Admin",
            email=settings.admin_email,
            password_hash=hash_senha(settings.admin_password),
            role="admin",
            sector="TI",
        )
    )
    await db.commit()