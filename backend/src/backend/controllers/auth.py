"""Controller de autenticação - rota /login."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.schemas.auth import LoginRequest, LoginResponse
from backend.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=LoginResponse, status_code=200)
async def login(dados: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    resultado = await service.login(dados.email, dados.password)
    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha invalidos",
        )
    return resultado