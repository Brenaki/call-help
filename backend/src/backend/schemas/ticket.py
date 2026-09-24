"""Schemas de chamados - DTOs."""

from datetime import date, datetime

from pydantic import BaseModel, field_serializer


class TicketCreate(BaseModel):
    user_id: int | None = None
    user_name: str
    equipment_id: int | None = None
    equipment_name: str | None = None
    sector: str | None = None
    localization: str | None = None
    problem_type: str | None = None
    description: str
    priority: str = "media"
    date: str | None = None


class TicketUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None


class TicketOut(BaseModel):
    id: int
    user_id: int | None
    equipment_id: int | None
    assigned_to: int | None
    user_name: str
    equipment_name: str | None
    sector: str | None
    localization: str | None
    problem_type: str | None
    description: str
    priority: str
    status: str
    date: str | None
    created_at: datetime | None
    updated_at: datetime | None
    closed_at: datetime | None

    model_config = {"from_attributes": True}

    @field_serializer("date")
    def _serialize_date(self, v):
        if v is None:
            return None
        if isinstance(v, str):
            return v
        return v.isoformat()