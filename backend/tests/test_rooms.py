"""Testes de salas e da relação N:N com equipamentos."""

import pytest

from backend.models.user import User
from backend.security import hash_senha


async def admin_token(client, db):
    db.add(User(name="Admin", email="salas@escola.edu", password_hash=hash_senha("123456"), role="admin"))
    await db.commit()
    response = await client.post("/login", json={"email": "salas@escola.edu", "password": "123456"})
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_equipamento_pode_pertencer_a_varias_salas(client, db):
    token = await admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    equipment = await client.post(
        "/equipamentos", headers=headers,
        json={"name": "Projetor móvel", "type": "Projetor", "localization": "Almoxarifado"},
    )
    equipment_id = equipment.json()["id"]

    first = await client.post(
        "/salas", headers=headers,
        json={"name": "Sala 12", "localization": "Bloco A", "equipment_ids": [equipment_id]},
    )
    second = await client.post(
        "/salas", headers=headers,
        json={"name": "Sala 13", "localization": "Bloco A", "equipment_ids": [equipment_id]},
    )
    assert first.status_code == 201
    assert second.status_code == 201

    rooms = await client.get("/salas", headers=headers)
    assert rooms.status_code == 200
    assert all(equipment_id in room["equipment_ids"] for room in rooms.json())


@pytest.mark.asyncio
async def test_opcoes_de_equipamento_e_chamado(client, db):
    token = await admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    await client.post(
        "/equipamentos", headers=headers,
        json={"name": "Notebook", "type": "Notebook", "localization": "Laboratório 1"},
    )
    options = await client.get("/equipamentos/opcoes", headers=headers)
    assert options.json()["types"] == ["Notebook"]
    assert options.json()["localizations"] == ["Laboratório 1"]

    ticket_options = await client.get("/chamados/opcoes", headers=headers)
    assert "Laboratório 1" in ticket_options.json()["localizations"]
