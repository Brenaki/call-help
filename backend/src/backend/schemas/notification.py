"""Schemas de notificações."""

from datetime import datetime

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    ticket_id: int | None
    type: str
    message: str
    is_read: bool
    created_at: datetime | None

    model_config = {"from_attributes": True}