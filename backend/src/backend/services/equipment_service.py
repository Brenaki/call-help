"""Service de equipamentos - regras de negócio."""

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.equipment import Equipment
from backend.repositories.equipment_repo import EquipmentRepository
from backend.schemas.equipment import EquipmentCreate, EquipmentUpdate


class EquipmentNameTaken(Exception):
    """Nome de equipamento já utilizado."""


class EquipmentService:
    def __init__(self, db: AsyncSession):
        self.equipment_repo = EquipmentRepository(db)

    async def list_all(self) -> list[Equipment]:
        return await self.equipment_repo.list_all()

    async def get_by_id(self, equipment_id: int) -> Equipment | None:
        return await self.equipment_repo.get_by_id(equipment_id)

    async def list_options(self) -> dict[str, list[str]]:
        return await self.equipment_repo.list_options()

    async def create(self, dados: EquipmentCreate) -> Equipment:
        name = dados.name.strip()
        if await self.equipment_repo.get_by_name(name):
            raise EquipmentNameTaken("Já existe um equipamento com este nome")
        equipment = Equipment(
            name=name,
            type=dados.type,
            localization=dados.localization,
        )
        return await self.equipment_repo.create(equipment)

    async def update(self, equipment_id: int, dados: EquipmentUpdate) -> Equipment | None:
        equipment = await self.equipment_repo.get_by_id(equipment_id)
        if equipment is None:
            return None
        if dados.name is not None:
            name = dados.name.strip()
            if await self.equipment_repo.get_by_name(name, exclude_id=equipment_id):
                raise EquipmentNameTaken("Já existe um equipamento com este nome")
            equipment.name = name
        if dados.type is not None:
            equipment.type = dados.type
        if dados.localization is not None:
            equipment.localization = dados.localization
        return await self.equipment_repo.update(equipment)

    async def delete(self, equipment_id: int) -> bool:
        equipment = await self.equipment_repo.get_by_id(equipment_id)
        if equipment is None:
            return False
        await self.equipment_repo.delete(equipment)
        return True
