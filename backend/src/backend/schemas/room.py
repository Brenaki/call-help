"""Schemas de salas e seus equipamentos."""

from datetime import datetime

from pydantic import BaseModel


class RoomCreate(BaseModel):
    name: str
    localization: str | None = None
    equipment_ids: list[int] = []


class RoomUpdate(BaseModel):
    name: str | None = None
    localization: str | None = None
    equipment_ids: list[int] | None = None


class RoomOut(BaseModel):
    id: int
    name: str
    localization: str | None
    equipment_ids: list[int]
    created_at: datetime | None

    model_config = {"from_attributes": True}
