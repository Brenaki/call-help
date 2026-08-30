"""Service de chamados - regras de negócio."""

from datetime import date as date_type

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
        self, status: str | None = None, user_id: int | None = None, sector: str | None = None
    ) -> list[Ticket]:
        return await self.ticket_repo.list_all(status, user_id, sector)

    async def get_by_id(self, ticket_id: int) -> Ticket | None:
        return await self.ticket_repo.get_by_id(ticket_id)

    async def search(self, termo: str) -> list[Ticket]:
        return await self.ticket_repo.search(termo)

    async def create(self, dados: TicketCreate) -> Ticket:
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
        return await self.ticket_repo.create(ticket)

    async def update(self, ticket_id: int, dados: TicketUpdate) -> Ticket | None:
        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if ticket is None:
            return None
        if dados.status is not None:
            if dados.status not in VALID_STATUS:
                return None
            ticket.status = dados.status
        if dados.technical_lead is not None:
            ticket.technical_lead = dados.technical_lead
        if dados.priority is not None and dados.priority in VALID_PRIORITY:
            ticket.priority = dados.priority
        return await self.ticket_repo.update(ticket)