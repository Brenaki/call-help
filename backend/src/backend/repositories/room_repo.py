"""Acesso a dados de salas."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.room import Room


class RoomRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all(self) -> list[Room]:
        result = await self.db.execute(
            select(Room).options(selectinload(Room.equipments)).order_by(Room.name)
        )
        return list(result.scalars().unique().all())

    async def get_by_id(self, room_id: int) -> Room | None:
        result = await self.db.execute(
            select(Room).options(selectinload(Room.equipments)).where(Room.id == room_id)
        )
        return result.scalar_one_or_none()

    async def create(self, room: Room) -> Room:
        self.db.add(room)
        await self.db.commit()
        await self.db.refresh(room, ["equipments"])
        return room

    async def update(self, room: Room) -> Room:
        await self.db.commit()
        await self.db.refresh(room, ["equipments"])
        return room

    async def delete(self, room: Room) -> None:
        await self.db.delete(room)
        await self.db.commit()
