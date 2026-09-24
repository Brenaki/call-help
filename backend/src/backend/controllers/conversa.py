"""Controller de conversa - comentários, status, atribuição, eventos."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, status, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.deps import get_current_user
from backend.models.ticket import Ticket
from backend.models.user import User
from backend.repositories.event_repo import EventRepository
from backend.schemas.attachment import AttachmentOut
from backend.schemas.comment import CommentOut, EventOut, StatusUpdate, AssignUpdate
from backend.schemas.ticket import TicketOut
from backend.services.conversa_service import ConversaService, TransicaoInvalida
from backend.services.ticket_service import TicketService

router = APIRouter(prefix="/chamados", tags=["conversa"])


def _erro_transicao(e: TransicaoInvalida) -> HTTPException:
    mapa = {403: 403, 413: 413, 415: 415}
    return HTTPException(status_code=mapa.get(e.code, 422), detail=e.mensagem)


async def obter_ticket_visivel(
    ticket_id: int, db: AsyncSession, user: User
) -> Ticket:
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


@router.get("/{ticket_id}/comentarios", response_model=list[CommentOut])
async def listar_comentarios(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ticket = await obter_ticket_visivel(ticket_id, db, user)
    conversa = ConversaService(db)
    comentarios = await conversa.listar_comentarios(ticket, user)

    def to_out(c):
        return CommentOut(
            id=c.id,
            ticket_id=c.ticket_id,
            author_id=c.author_id,
            author_name=c.author.name if c.author else "—",
            author_role=c.author.role if c.author else "",
            is_internal=c.is_internal,
            body=c.body,
            attachments=[AttachmentOut.model_validate(a) for a in getattr(c, "attachments", [])],
            created_at=c.created_at,
        )

    return [to_out(c) for c in comentarios]


@router.post("/{ticket_id}/comentarios", status_code=201)
async def adicionar_comentario(
    ticket_id: int,
    body: Annotated[str, Form()],
    is_internal: Annotated[str, Form()] = "false",
    files: list[UploadFile] | None = File(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ticket = await obter_ticket_visivel(ticket_id, db, user)
    conversa = ConversaService(db)
    try:
        resultado = await conversa.adicionar_comentario(
            ticket,
            user,
            body,
            is_internal.lower() in ("true", "1", "on"),
            files,
        )
    except TransicaoInvalida as e:
        raise _erro_transicao(e) from None

    comment = resultado["comment"]
    return {
        "id": comment.id,
        "ticket_id": comment.ticket_id,
        "author_id": comment.author_id,
        "author_name": user.name,
        "author_role": user.role,
        "is_internal": comment.is_internal,
        "body": comment.body,
        "attachments": [
            AttachmentOut.model_validate(a) for a in resultado["attachments"]
        ],
        "created_at": comment.created_at,
        "ticket_status": resultado["ticket_status"],
    }


@router.put("/{ticket_id}/status", response_model=TicketOut)
async def mudar_status(
    ticket_id: int,
    dados: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ticket = await obter_ticket_visivel(ticket_id, db, user)
    conversa = ConversaService(db)
    try:
        ticket = await conversa.mudar_status(ticket, user, dados.status)
    except TransicaoInvalida as e:
        raise _erro_transicao(e) from None
    return ticket


@router.put("/{ticket_id}/atribuir", response_model=TicketOut)
async def atribuir(
    ticket_id: int,
    dados: AssignUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ticket = await obter_ticket_visivel(ticket_id, db, user)
    conversa = ConversaService(db)
    try:
        ticket = await conversa.atribuir(ticket, user, dados.assigned_to)
    except TransicaoInvalida as e:
        raise _erro_transicao(e) from None
    return ticket


@router.get("/{ticket_id}/eventos", response_model=list[EventOut])
async def listar_eventos(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await obter_ticket_visivel(ticket_id, db, user)
    return await EventRepository(db).list_by_ticket(ticket_id)