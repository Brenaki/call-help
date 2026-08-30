"""Repository de equipamentos - acesso ao banco."""

from sqlalchemy import select
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

    async def list_all(self) -> list[Equipment]:
        result = await self.db.execute(select(Equipment).order_by(Equipment.id))
        return list(result.scalars().all())

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