"""Schemas de autenticação."""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    must_change_password: bool = False


class TokenData(BaseModel):
    user_id: int | None = None
    role: str | None = None
