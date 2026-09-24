"""Repository de anexos."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.attachment import Attachment


class AttachmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, attachment_id: int) -> Attachment | None:
        result = await self.db.execute(
            select(Attachment).where(Attachment.id == attachment_id)
        )
        return result.scalar_one_or_none()

    async def create(self, attachment: Attachment) -> Attachment:
        self.db.add(attachment)
        await self.db.commit()
        await self.db.refresh(attachment)
        return attachment