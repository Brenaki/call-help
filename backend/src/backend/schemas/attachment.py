"""Schema de anexos."""

from datetime import datetime

from pydantic import BaseModel


class AttachmentOut(BaseModel):
    id: int
    ticket_id: int
    comment_id: int | None
    file_name: str
    stored_name: str
    mime_type: str
    size_bytes: int
    uploaded_by: int
    created_at: datetime | None

    model_config = {"from_attributes": True}