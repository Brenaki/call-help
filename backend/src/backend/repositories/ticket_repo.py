"""Repository de chamados - acesso ao banco."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.ticket import Ticket
from backend.models.equipment import Equipment
from backend.models.user import User


class TicketRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, ticket_id: int) -> Ticket | None:
        result = await self.db.execute(
            select(Ticket).where(Ticket.id == ticket_id)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        status: str | None = None,
        user_id: int | None = None,
        sector: str | None = None,
        termo: str | None = None,
    ) -> list[Ticket]:
        query = select(Ticket).order_by(Ticket.id.desc())
        if status:
            query = query.where(Ticket.status == status)
        if user_id:
            query = query.where(Ticket.user_id == user_id)
        if sector:
            query = query.where(Ticket.sector == sector)
        if termo:
            like = f"%{termo}%"
            query = query.where(
                or_(
                    Ticket.description.ilike(like),
                    Ticket.user_name.ilike(like),
                    Ticket.problem_type.ilike(like),
                    Ticket.equipment_name.ilike(like),
                )
            )
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

    async def list_options(self) -> dict[str, list[str]]:
        ticket_sectors = await self.db.scalars(
            select(Ticket.sector).where(Ticket.sector.is_not(None)).distinct()
        )
        user_sectors = await self.db.scalars(
            select(User.sector).where(User.sector.is_not(None)).distinct()
        )
        ticket_localizations = await self.db.scalars(
            select(Ticket.localization).where(Ticket.localization.is_not(None)).distinct()
        )
        equipment_localizations = await self.db.scalars(
            select(Equipment.localization).where(Equipment.localization.is_not(None)).distinct()
        )
        return {
            "sectors": sorted({value for value in [*ticket_sectors.all(), *user_sectors.all()] if value}),
            "localizations": sorted({value for value in [*ticket_localizations.all(), *equipment_localizations.all()] if value}),
        }

    async def create(self, ticket: Ticket) -> Ticket:
        self.db.add(ticket)
        await self.db.commit()
        await self.db.refresh(ticket)
        return ticket

    async def update(self, ticket: Ticket) -> Ticket:
        await self.db.commit()
        await self.db.refresh(ticket)
        return ticket
