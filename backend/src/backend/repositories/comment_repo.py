"""Repository de comentários - acesso ao banco."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.attachment import Attachment
from backend.models.ticket_comment import TicketComment


class CommentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_ticket(self, ticket_id: int) -> list[TicketComment]:
        result = await self.db.execute(
            select(TicketComment)
            .options(selectinload(TicketComment.author))
            .where(TicketComment.ticket_id == ticket_id)
            .order_by(TicketComment.id.asc())
        )
        comments = list(result.scalars().all())
        # carrega anexos de cada comentário
        for comment in comments:
            atts = await self.db.execute(
                select(Attachment).where(Attachment.comment_id == comment.id)
            )
            comment.attachments = list(atts.scalars().all())
        return comments

    async def create(self, comment: TicketComment) -> TicketComment:
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return comment