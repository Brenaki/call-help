"""Schemas de usuários - DTOs de entrada e saída."""

from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "comum"
    sector: str | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    role: str | None = None
    sector: str | None = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    sector: str | None
    created_at: datetime | None

    model_config = {"from_attributes": True}