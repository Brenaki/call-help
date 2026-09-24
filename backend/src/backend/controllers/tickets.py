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
    scope: str | None = Query(None),
    q: str | None = Query(None, min_length=1),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = TicketService(db)
    # comum só vê os próprios chamados; admin pode escolher escopo
    user_id = None
    if user.role != "admin":
        user_id = user.id
    elif scope == "meus":
        user_id = user.id
    return await service.list_all(status_filter, user_id, None, q)


@router.get("/busca", response_model=list[TicketOut])
async def buscar(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = TicketService(db)
    chamados = await service.search(q)
    if user.role != "admin":
        chamados = [c for c in chamados if c.user_id == user.id]
    return chamados


@router.get("/{ticket_id}", response_model=TicketOut)
async def detalhe(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from backend.services.conversa_service import ConversaService

    service = TicketService(db)
    ticket = await service.get_by_id(ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado nao encontrado",
        )
    conversa = ConversaService(db)
    if not conversa.pode_ver_chamado(ticket, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissao para acessar este chamado",
        )
    return ticket


@router.post("", response_model=TicketOut, status_code=201)
async def criar(
    dados: TicketCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = TicketService(db)
    dados.user_id = user.id
    return await service.create(dados, user)


@router.put("/{ticket_id}", response_model=TicketOut)
async def editar(
    ticket_id: int,
    dados: TicketUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = TicketService(db)
    ticket = await service.update(ticket_id, dados)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado nao encontrado ou status invalido",
        )
    return ticket