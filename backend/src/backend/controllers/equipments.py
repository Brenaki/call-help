"""Controller de equipamentos - CRUD (só admin)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.deps import get_current_user, require_admin
from backend.models.user import User
from backend.schemas.equipment import EquipmentCreate, EquipmentOut, EquipmentUpdate
from backend.services.equipment_service import EquipmentNameTaken, EquipmentService

router = APIRouter(prefix="/equipamentos", tags=["equipamentos"])


@router.get("", response_model=list[EquipmentOut])
async def listar(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    service = EquipmentService(db)
    return await service.list_all()


@router.get("/catalogo", response_model=list[EquipmentOut])
async def catalogo(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Lista de equipamentos para o formulário de abertura de chamado."""
    return await EquipmentService(db).list_all()


@router.get("/opcoes")
async def opcoes(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await EquipmentService(db).list_options()


@router.post("", response_model=EquipmentOut, status_code=201)
async def criar(
    dados: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    service = EquipmentService(db)
    try:
        return await service.create(dados)
    except EquipmentNameTaken as error:
        raise HTTPException(status_code=409, detail=str(error)) from None


@router.put("/{equipment_id}", response_model=EquipmentOut)
async def editar(
    equipment_id: int,
    dados: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    service = EquipmentService(db)
    try:
        equipment = await service.update(equipment_id, dados)
    except EquipmentNameTaken as error:
        raise HTTPException(status_code=409, detail=str(error)) from None
    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipamento nao encontrado",
        )
    return equipment


@router.delete("/{equipment_id}", status_code=204)
async def remover(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    service = EquipmentService(db)
    deletado = await service.delete(equipment_id)
    if not deletado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipamento nao encontrado",
        )
