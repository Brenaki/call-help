"""Controller de usuários - CRUD (só admin)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.deps import require_admin
from backend.models.user import User
from backend.schemas.user import UserCreate, UserOut, UserUpdate
from backend.services.user_service import UserService

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", response_model=list[UserOut])
async def listar(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    service = UserService(db)
    return await service.list_all()


@router.post("", response_model=UserOut, status_code=201)
async def criar(
    dados: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    service = UserService(db)
    return await service.create(dados)


@router.put("/{user_id}", response_model=UserOut)
async def editar(
    user_id: int,
    dados: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    service = UserService(db)
    user = await service.update(user_id, dados)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario nao encontrado",
        )
    return user


@router.delete("/{user_id}", status_code=204)
async def remover(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    service = UserService(db)
    deletado = await service.delete(user_id)
    if not deletado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario nao encontrado",
        )