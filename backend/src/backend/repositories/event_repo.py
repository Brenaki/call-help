"""Repository de eventos - histórico do chamado."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.ticket_event import TicketEvent
from backend.models.user import User


class EventRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_ticket(self, ticket_id: int) -> list[dict]:
        result = await self.db.execute(
            select(TicketEvent, User.name)
            .outerjoin(User, TicketEvent.user_id == User.id)
            .where(TicketEvent.ticket_id == ticket_id)
            .order_by(TicketEvent.id.asc())
        )
        rows = result.all()
        eventos = []
        for event, user_name in rows:
            data = {
                "id": event.id,
                "ticket_id": event.ticket_id,
                "user_id": event.user_id,
                "user_name": user_name,
                "event_type": event.event_type,
                "old_value": event.old_value,
                "new_value": event.new_value,
                "created_at": event.created_at,
            }
            eventos.append(data)
        return eventos

    async def create(self, event: TicketEvent) -> TicketEvent:
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event