"""Testes de autenticação - TDD vermelho primeiro."""

import pytest

from backend.models.user import User
from backend.security import hash_senha


@pytest.mark.asyncio
async def test_login_sucesso(client, db):
    user = User(
        name="Joao",
        email="joao@escola.edu",
        password_hash=hash_senha("123456"),
        role="admin",
        sector="Informatica",
    )
    db.add(user)
    await db.commit()

    response = await client.post(
        "/login",
        json={"email": "joao@escola.edu", "password": "123456"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_login_senha_errada(client, db):
    user = User(
        name="Maria",
        email="maria@escola.edu",
        password_hash=hash_senha("senha123"),
        role="comum",
    )
    db.add(user)
    await db.commit()

    response = await client.post(
        "/login",
        json={"email": "maria@escola.edu", "password": "errada"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_email_inexistente(client):
    response = await client.post(
        "/login",
        json={"email": "ninguem@escola.edu", "password": "123456"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_sem_senha(client):
    response = await client.post(
        "/login",
        json={"email": "joao@escola.edu"},
    )
    assert response.status_code == 422