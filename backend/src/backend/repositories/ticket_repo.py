"""Repository de chamados - acesso ao banco."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.ticket import Ticket


class TicketRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, ticket_id: int) -> Ticket | None:
        result = await self.db.execute(
            select(Ticket).where(Ticket.id == ticket_id)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self, status: str | None = None, user_id: int | None = None, sector: str | None = None
    ) -> list[Ticket]:
        query = select(Ticket).order_by(Ticket.id.desc())
        if status:
            query = query.where(Ticket.status == status)
        if user_id:
            query = query.where(Ticket.user_id == user_id)
        if sector:
            query = query.where(Ticket.sector == sector)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def search(self, termo: str) -> list[Ticket]:
        like = f"%{termo}%"
        query = (
            select(Ticket)
            .where(
                or_(
                    Ticket.description.ilike(like),
                    Ticket.user_name.ilike(like),
                    Ticket.problem_type.ilike(like),
                    Ticket.equipment_name.ilike(like),
                )
            )
            .order_by(Ticket.id.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, ticket: Ticket) -> Ticket:
        self.db.add(ticket)
        await self.db.commit()
        await self.db.refresh(ticket)
        return ticket

    async def update(self, ticket: Ticket) -> Ticket:
        await self.db.commit()
        await self.db.refresh(ticket)
        return ticket