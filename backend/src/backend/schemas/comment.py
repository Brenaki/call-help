"""Schemas de conversa: comentários, anexos, eventos, status, atribuição."""

from datetime import datetime

from pydantic import BaseModel

from backend.schemas.attachment import AttachmentOut


class CommentCreate(BaseModel):
    body: str
    is_internal: bool = False


class CommentOut(BaseModel):
    id: int
    ticket_id: int
    author_id: int
    author_name: str
    author_role: str
    is_internal: bool
    body: str
    attachments: list[AttachmentOut] = []
    created_at: datetime | None

    model_config = {"from_attributes": True}


class StatusUpdate(BaseModel):
    status: str


class AssignUpdate(BaseModel):
    assigned_to: int


class EventOut(BaseModel):
    id: int
    ticket_id: int
    user_id: int | None
    user_name: str | None
    event_type: str
    old_value: str | None
    new_value: str | None
    created_at: datetime | None

    model_config = {"from_attributes": True}