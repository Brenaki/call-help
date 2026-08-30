"""Testes de equipamentos - CRUD (só admin)."""

import pytest

from backend.models.user import User
from backend.security import hash_senha


async def criar_admin_e_logar(client, db, email):
    user = User(
        name="Admin",
        email=email,
        password_hash=hash_senha("123456"),
        role="admin",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    response = await client.post(
        "/login", json={"email": email, "password": "123456"}
    )
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_listar_equipamentos_vazio(client, db):
    token = await criar_admin_e_logar(client, db, "eqadmin@escola.edu")
    response = await client.get(
        "/equipamentos", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_criar_equipamento(client, db):
    token = await criar_admin_e_logar(client, db, "eqadmin2@escola.edu")
    response = await client.post(
        "/equipamentos",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Computador 02",
            "type": "Desktop",
            "localization": "Laboratorio 2",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Computador 02"
    assert data["type"] == "Desktop"
    assert data["localization"] == "Laboratorio 2"


@pytest.mark.asyncio
async def test_editar_equipamento(client, db):
    token = await criar_admin_e_logar(client, db, "eqadmin3@escola.edu")
    response = await client.post(
        "/equipamentos",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Notebook 01", "type": "Notebook"},
    )
    eq_id = response.json()["id"]

    response = await client.put(
        f"/equipamentos/{eq_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Notebook 01 - Reparado", "localization": "Sala 5"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Notebook 01 - Reparado"
    assert response.json()["localization"] == "Sala 5"


@pytest.mark.asyncio
async def test_remover_equipamento(client, db):
    token = await criar_admin_e_logar(client, db, "eqadmin4@escola.edu")
    response = await client.post(
        "/equipamentos",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Para Remover"},
    )
    eq_id = response.json()["id"]

    response = await client.delete(
        f"/equipamentos/{eq_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_comum_nao_pode_listar_equipamentos(client, db):
    user = User(
        name="Comum",
        email="eqcomum@escola.edu",
        password_hash=hash_senha("123456"),
        role="comum",
    )
    db.add(user)
    await db.commit()
    response = await client.post(
        "/login", json={"email": "eqcomum@escola.edu", "password": "123456"}
    )
    token = response.json()["access_token"]

    response = await client.get(
        "/equipamentos", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403