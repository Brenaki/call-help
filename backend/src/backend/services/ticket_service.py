"""Service de chamados - regras de negócio."""

from datetime import date as date_type, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.ticket import Ticket
from backend.repositories.ticket_repo import TicketRepository
from backend.schemas.ticket import TicketCreate, TicketUpdate

VALID_STATUS = {"aberto", "em_andamento", "resolvido"}
VALID_PRIORITY = {"baixa", "media", "alta"}


def _parse_date(valor: str | None) -> date_type | None:
    if valor is None:
        return None
    try:
        return date_type.fromisoformat(valor.replace("/", "-"))
    except Exception:
        return None


class TicketService:
    def __init__(self, db: AsyncSession):
        self.ticket_repo = TicketRepository(db)

    async def list_all(
        self,
        status: str | None = None,
        user_id: int | None = None,
        sector: str | None = None,
        termo: str | None = None,
    ) -> list[Ticket]:
        return await self.ticket_repo.list_all(status, user_id, sector, termo)

    async def get_by_id(self, ticket_id: int) -> Ticket | None:
        return await self.ticket_repo.get_by_id(ticket_id)

    async def search(self, termo: str) -> list[Ticket]:
        return await self.ticket_repo.search(termo)

    async def list_options(self) -> dict[str, list[str]]:
        return await self.ticket_repo.list_options()

    async def create(self, dados: TicketCreate, user=None) -> Ticket:
        ticket = Ticket(
            user_id=dados.user_id,
            user_name=dados.user_name,
            equipment_id=dados.equipment_id,
            equipment_name=dados.equipment_name,
            sector=dados.sector,
            localization=dados.localization,
            problem_type=dados.problem_type,
            description=dados.description,
            priority=dados.priority if dados.priority in VALID_PRIORITY else "media",
            status="aberto",
            date=_parse_date(dados.date),
        )
        ticket = await self.ticket_repo.create(ticket)

        # evento de criação no histórico
        from backend.models.ticket_event import TicketEvent
        from backend.repositories.event_repo import EventRepository

        event_repo = EventRepository(self.ticket_repo.db)
        await event_repo.create(
            TicketEvent(
                ticket_id=ticket.id,
                user_id=user.id if user else None,
                event_type="criacao",
                new_value="aberto",
            )
        )
        return ticket

    async def update(self, ticket_id: int, dados: TicketUpdate) -> Ticket | None:
        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if ticket is None:
            return None
        if dados.status is not None:
            if dados.status not in VALID_STATUS:
                return None
            ticket.status = dados.status
            if dados.status == "fechado":
                ticket.closed_at = datetime.now(timezone.utc)
        if dados.priority is not None and dados.priority in VALID_PRIORITY:
            ticket.priority = dados.priority
        return await self.ticket_repo.update(ticket)
