"""Repository de equipamentos - acesso ao banco."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.equipment import Equipment


class EquipmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, equipment_id: int) -> Equipment | None:
        result = await self.db.execute(
            select(Equipment).where(Equipment.id == equipment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str, exclude_id: int | None = None) -> Equipment | None:
        query = select(Equipment).where(func.lower(Equipment.name) == name.strip().lower())
        if exclude_id is not None:
            query = query.where(Equipment.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Equipment]:
        result = await self.db.execute(select(Equipment).order_by(Equipment.id))
        return list(result.scalars().all())

    async def list_options(self) -> dict[str, list[str]]:
        types = await self.db.scalars(
            select(Equipment.type).where(Equipment.type.is_not(None)).distinct()
        )
        localizations = await self.db.scalars(
            select(Equipment.localization).where(Equipment.localization.is_not(None)).distinct()
        )
        return {
            "types": sorted(value for value in types.all() if value),
            "localizations": sorted(value for value in localizations.all() if value),
        }

    async def create(self, equipment: Equipment) -> Equipment:
        self.db.add(equipment)
        await self.db.commit()
        await self.db.refresh(equipment)
        return equipment

    async def update(self, equipment: Equipment) -> Equipment:
        await self.db.commit()
        await self.db.refresh(equipment)
        return equipment

    async def delete(self, equipment: Equipment) -> None:
        await self.db.delete(equipment)
        await self.db.commit()
