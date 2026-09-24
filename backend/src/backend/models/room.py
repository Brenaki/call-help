"""Model Room e relação N:N entre salas e equipamentos."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base

if TYPE_CHECKING:
    from backend.models.equipment import Equipment


room_equipments = Table(
    "room_equipments",
    Base.metadata,
    Column("room_id", Integer, ForeignKey("rooms.id", ondelete="CASCADE"), primary_key=True),
    Column("equipment_id", Integer, ForeignKey("equipments.id", ondelete="CASCADE"), primary_key=True),
)


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    localization: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    equipments: Mapped[list[Equipment]] = relationship(
        secondary=room_equipments, back_populates="rooms", lazy="selectin"
    )

    @property
    def equipment_ids(self) -> list[int]:
        return [equipment.id for equipment in self.equipments]
