"""Testes de usuários - CRUD (só admin)."""

import pytest

from backend.models.user import User
from backend.security import hash_senha


async def criar_e_logar(client, db, email, senha, role):
    """Cria usuário no banco e faz login, retorna o token."""
    user = User(
        name="Teste",
        email=email,
        password_hash=hash_senha(senha),
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    response = await client.post(
        "/login", json={"email": email, "password": senha}
    )
    token = response.json()["access_token"]
    return token, user.id


@pytest.mark.asyncio
async def test_listar_usuarios_como_admin(client, db):
    token, _ = await criar_e_logar(client, db, "admin@escola.edu", "123456", "admin")
    db.add(User(name="Maria", email="maria@escola.edu", password_hash=hash_senha("123"), role="comum"))
    await db.commit()

    response = await client.get(
        "/usuarios", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_listar_usuarios_como_comum_da_403(client, db):
    token, _ = await criar_e_logar(client, db, "comum@escola.edu", "123456", "comum")
    response = await client.get(
        "/usuarios", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_criar_usuario(client, db):
    token, _ = await criar_e_logar(client, db, "admin2@escola.edu", "123456", "admin")
    response = await client.post(
        "/usuarios",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Isabelle",
            "email": "isabelle@escola.edu",
            "password": "senha123",
            "role": "comum",
            "sector": "Informatica",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Isabelle"
    assert data["email"] == "isabelle@escola.edu"
    assert data["role"] == "comum"
    assert "password" not in data


@pytest.mark.asyncio
async def test_editar_usuario(client, db):
    token, admin_id = await criar_e_logar(client, db, "admin3@escola.edu", "123456", "admin")
    response = await client.post(
        "/usuarios",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Joao",
            "email": "joao3@escola.edu",
            "password": "123",
            "role": "comum",
        },
    )
    user_id = response.json()["id"]

    response = await client.put(
        f"/usuarios/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Joao Silva", "sector": "Administrativo"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Joao Silva"
    assert response.json()["sector"] == "Administrativo"


@pytest.mark.asyncio
async def test_remover_usuario(client, db):
    token, _ = await criar_e_logar(client, db, "admin4@escola.edu", "123456", "admin")
    response = await client.post(
        "/usuarios",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Para Remover",
            "email": "remover@escola.edu",
            "password": "123",
        },
    )
    user_id = response.json()["id"]

    response = await client.delete(
        f"/usuarios/{user_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 204

    response = await client.get(
        "/usuarios", headers={"Authorization": f"Bearer {token}"}
    )
    emails = [u["email"] for u in response.json()]
    assert "remover@escola.edu" not in emails


@pytest.mark.asyncio
async def test_editar_usuario_inexistente(client, db):
    token, _ = await criar_e_logar(client, db, "admin5@escola.edu", "123456", "admin")
    response = await client.put(
        "/usuarios/9999",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Ninguem"},
    )
    assert response.status_code == 404