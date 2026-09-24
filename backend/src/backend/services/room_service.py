"""Regras de negócio de salas."""

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.room import Room
from backend.repositories.equipment_repo import EquipmentRepository
from backend.repositories.room_repo import RoomRepository
from backend.schemas.room import RoomCreate, RoomUpdate


class RoomService:
    def __init__(self, db: AsyncSession):
        self.room_repo = RoomRepository(db)
        self.equipment_repo = EquipmentRepository(db)

    async def list_all(self) -> list[Room]:
        return await self.room_repo.list_all()

    async def _equipments(self, ids: list[int]):
        unique_ids = list(dict.fromkeys(ids))
        equipments = []
        for equipment_id in unique_ids:
            equipment = await self.equipment_repo.get_by_id(equipment_id)
            if equipment is None:
                raise ValueError(f"Equipamento {equipment_id} nao encontrado")
            equipments.append(equipment)
        return equipments

    async def create(self, dados: RoomCreate) -> Room:
        room = Room(name=dados.name.strip(), localization=dados.localization or None)
        room.equipments = await self._equipments(dados.equipment_ids)
        return await self.room_repo.create(room)

    async def update(self, room_id: int, dados: RoomUpdate) -> Room | None:
        room = await self.room_repo.get_by_id(room_id)
        if room is None:
            return None
        if dados.name is not None:
            room.name = dados.name.strip()
        if dados.localization is not None:
            room.localization = dados.localization or None
        if dados.equipment_ids is not None:
            room.equipments = await self._equipments(dados.equipment_ids)
        return await self.room_repo.update(room)

    async def delete(self, room_id: int) -> bool:
        room = await self.room_repo.get_by_id(room_id)
        if room is None:
            return False
        await self.room_repo.delete(room)
        return True
