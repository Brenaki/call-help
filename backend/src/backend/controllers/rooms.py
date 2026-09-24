"""CRUD de salas e vínculo N:N com equipamentos."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.deps import get_current_user, require_admin
from backend.models.user import User
from backend.schemas.room import RoomCreate, RoomOut, RoomUpdate
from backend.services.room_service import RoomService

router = APIRouter(prefix="/salas", tags=["salas"])


@router.get("", response_model=list[RoomOut])
async def listar(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await RoomService(db).list_all()


@router.post("", response_model=RoomOut, status_code=201)
async def criar(
    dados: RoomCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        return await RoomService(db).create(dados)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from None


@router.put("/{room_id}", response_model=RoomOut)
async def editar(
    room_id: int,
    dados: RoomUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        room = await RoomService(db).update(room_id, dados)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from None
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala nao encontrada")
    return room


@router.delete("/{room_id}", status_code=204)
async def remover(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    if not await RoomService(db).delete(room_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala nao encontrada")
