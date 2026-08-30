"""Controller de chamados - CRUD + busca (qualquer logado)."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.deps import get_current_user
from backend.models.user import User
from backend.schemas.ticket import TicketCreate, TicketOut, TicketUpdate
from backend.services.ticket_service import TicketService

router = APIRouter(prefix="/chamados", tags=["chamados"])


@router.get("", response_model=list[TicketOut])
async def listar(
    status_filter: str | None = Query(None, alias="status"),
    user_id: int | None = Query(None, alias="user_id"),
    sector: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = TicketService(db)
    return await service.list_all(status_filter, user_id, sector)


@router.get("/busca", response_model=list[TicketOut])
async def buscar(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = TicketService(db)
    return await service.search(q)


@router.get("/{ticket_id}", response_model=TicketOut)
async def detalhe(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = TicketService(db)
    ticket = await service.get_by_id(ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado nao encontrado",
        )
    return ticket


@router.post("", response_model=TicketOut, status_code=201)
async def criar(
    dados: TicketCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = TicketService(db)
    return await service.create(dados)


@router.put("/{ticket_id}", response_model=TicketOut)
async def editar(
    ticket_id: int,
    dados: TicketUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = TicketService(db)
    ticket = await service.update(ticket_id, dados)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado nao encontrado ou status invalido",
        )
    return ticket