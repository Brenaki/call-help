"""Testes de chamados - CRUD + busca."""

import pytest

from backend.models.user import User
from backend.security import hash_senha


async def criar_usuario_e_logar(client, db, email, role="comum"):
    user = User(
        name="Usuario",
        email=email,
        password_hash=hash_senha("123456"),
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    response = await client.post(
        "/login", json={"email": email, "password": "123456"}
    )
    return response.json()["access_token"], user.id


@pytest.mark.asyncio
async def test_abrir_chamado(client, db):
    token, user_id = await criar_usuario_e_logar(client, db, "tk1@escola.edu")
    response = await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "user_name": "Isabelle",
            "user_id": user_id,
            "equipment_name": "Computador 02",
            "sector": "Informatica",
            "localization": "Laboratorio 2",
            "problem_type": "Hardware",
            "description": "Computador nao liga",
            "priority": "alta",
            "date": "26/08/2026",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user_name"] == "Usuario"
    assert data["status"] == "aberto"
    assert data["priority"] == "alta"
    assert data["description"] == "Computador nao liga"


@pytest.mark.asyncio
async def test_listar_chamados(client, db):
    token, user_id = await criar_usuario_e_logar(client, db, "tk2@escola.edu")
    await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={"user_name": "Ana", "description": "Mouse quebrado"},
    )
    await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={"user_name": "Bruno", "description": "Teclado nao funciona"},
    )
    response = await client.get(
        "/chamados", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) >= 2


@pytest.mark.asyncio
async def test_filtrar_por_status(client, db):
    token, user_id = await criar_usuario_e_logar(client, db, "tk3@escola.edu")
    response = await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={"user_name": "Carlos", "description": "Sem internet"},
    )
    chamado_id = response.json()["id"]

    await client.put(
        f"/chamados/{chamado_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "em_andamento"},
    )

    response = await client.get(
        "/chamados?status=em_andamento",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    for chamado in response.json():
        assert chamado["status"] == "em_andamento"


@pytest.mark.asyncio
async def test_alterar_status_chamado(client, db):
    token, user_id = await criar_usuario_e_logar(client, db, "tk4@escola.edu")
    response = await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={"user_name": "Diego", "description": "Monitor piscando"},
    )
    chamado_id = response.json()["id"]

    response = await client.put(
        f"/chamados/{chamado_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "em_andamento", "priority": "alta"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "em_andamento"
    assert response.json()["priority"] == "alta"


@pytest.mark.asyncio
async def test_resolver_chamado(client, db):
    token, user_id = await criar_usuario_e_logar(client, db, "tk5@escola.edu")
    response = await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={"user_name": "Erika", "description": "Impressora nao printa"},
    )
    chamado_id = response.json()["id"]

    response = await client.put(
        f"/chamados/{chamado_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "resolvido"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "resolvido"


@pytest.mark.asyncio
async def test_buscar_chamado_por_descricao(client, db):
    token, user_id = await criar_usuario_e_logar(client, db, "tk6@escola.edu")
    await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={"user_name": "Felipe", "description": "Computador nao liga de jeito nenhum"},
    )
    await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={"user_name": "Gabi", "description": "Mouse parou"},
    )

    response = await client.get(
        "/chamados/busca?q=Computador",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert "Computador" in data[0]["description"]


@pytest.mark.asyncio
async def test_buscar_chamado_por_usuario(client, db):
    token, user_id = await criar_usuario_e_logar(client, db, "tk7@escola.edu")
    await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={"user_name": "Isabelle", "description": "qualquer coisa"},
    )

    response = await client.get(
        "/chamados/busca?q=Isabelle",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_detalhe_chamado(client, db):
    token, user_id = await criar_usuario_e_logar(client, db, "tk8@escola.edu")
    response = await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={"user_name": "Helena", "description": "Cabos soltos"},
    )
    chamado_id = response.json()["id"]

    response = await client.get(
        f"/chamados/{chamado_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == chamado_id


@pytest.mark.asyncio
async def test_detalhe_chamado_inexistente(client, db):
    token, user_id = await criar_usuario_e_logar(client, db, "tk9@escola.edu")
    response = await client.get(
        "/chamados/9999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_sem_token_nao_pode_listar_chamados(client):
    response = await client.get("/chamados")
    assert response.status_code == 401
