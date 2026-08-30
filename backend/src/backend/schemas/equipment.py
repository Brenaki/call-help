"""Schemas de equipamentos - DTOs."""

from datetime import datetime

from pydantic import BaseModel


class EquipmentCreate(BaseModel):
    name: str
    type: str | None = None
    localization: str | None = None


class EquipmentUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    localization: str | None = None


class EquipmentOut(BaseModel):
    id: int
    name: str
    type: str | None
    localization: str | None
    created_at: datetime | None

    model_config = {"from_attributes": True}