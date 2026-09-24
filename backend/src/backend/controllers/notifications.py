"""Controller de notificações."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.deps import get_current_user
from backend.models.user import User
from backend.repositories.notification_repo import NotificationRepository
from backend.schemas.notification import NotificationOut

router = APIRouter(prefix="/notificacoes", tags=["notificacoes"])


@router.get("", response_model=list[NotificationOut])
async def minhas_notificacoes(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = NotificationRepository(db)
    return await repo.list_for_user(user.id)


@router.get("/nao-lidas")
async def contador_nao_lidas(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = NotificationRepository(db)
    return {"count": await repo.unread_count(user.id)}


@router.put("/ler-todas")
async def marcar_todas_lidas(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = NotificationRepository(db)
    total = await repo.mark_all_read(user.id)
    return {"marked": total}


@router.put("/{notification_id}/ler")
async def marcar_lida(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = NotificationRepository(db)
    ok = await repo.mark_read(notification_id, user.id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificacao nao encontrada",
        )
    return {"ok": True}