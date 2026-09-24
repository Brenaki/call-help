"""Testes do WebSocket /ws e do seed de admin."""

import io

import pytest

from backend.models.user import User
from backend.security import hash_senha


async def criar_usuario_e_logar(client, db, email, role="comum"):
    user = User(
        name="Usuario " + email.split("@")[0],
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
async def test_ws_conecta_com_token_valido(client, db):
    from backend.main import app
    from starlette.testclient import TestClient

    _, user_id = await criar_usuario_e_logar(client, db, "ws1@escola.edu")
    # pega token via login
    login = await client.post("/login", json={"email": "ws1@escola.edu", "password": "123456"})
    token = login.json()["access_token"]

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws?token={token}") as ws:
            mensagem = ws.receive_json()
            assert mensagem["type"] == "connected"
            assert mensagem["user_id"] == user_id


@pytest.mark.asyncio
async def test_ws_rejeita_token_invalido(client, db):
    from backend.main import app
    from starlette.testclient import TestClient
    from starlette.websockets import WebSocketDisconnect

    with TestClient(app) as tc:
        with pytest.raises(WebSocketDisconnect) as exc:
            with tc.websocket_connect("/ws?token=invalido"):
                pass
        assert exc.value.code == 4401


@pytest.mark.asyncio
async def test_ws_recebe_evento_de_comentario(client, db):
    """Comentário num chamado dispara push para o dono conectado."""
    from backend.main import app
    from starlette.testclient import TestClient

    token_soli, id_soli = await criar_usuario_e_logar(client, db, "ws2@escola.edu")
    token_admin, _ = await criar_usuario_e_logar(client, db, "ws2admin@escola.edu", role="admin")

    # dono cria chamado
    r = await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token_soli}"},
        json={"user_name": "Soli", "user_id": id_soli, "description": "sem internet"},
    )
    ticket_id = r.json()["id"]

    with TestClient(app) as tc:
        # solicitante conecta ao WS
        with tc.websocket_connect(f"/ws?token={token_soli}") as ws:
            _ = ws.receive_json()  # connected

            # admin comenta via HTTP
            await client.post(
                f"/chamados/{ticket_id}/comentarios",
                headers={"Authorization": f"Bearer {token_admin}"},
                data={"body": "estamos verificando", "is_internal": "false"},
                files={"files": ("diagnostico.txt", io.BytesIO(b"log"), "text/plain")},
            )

            # solicitante recebe push do comentário (notificação pode chegar antes)
            eventos = []
            while True:
                evento = ws.receive_json()
                eventos.append(evento)
                if evento["type"] == "comment":
                    break
            comment_event = next(e for e in eventos if e["type"] == "comment")
            assert comment_event["ticket_id"] == ticket_id
            assert comment_event["comment"]["attachments"][0]["file_name"] == "diagnostico.txt"


@pytest.mark.asyncio
async def test_ws_contador_nao_lidas(client, db):
    """Push de unread_count chega quando notificação é criada."""
    from backend.main import app
    from starlette.testclient import TestClient

    token_soli, id_soli = await criar_usuario_e_logar(client, db, "ws3@escola.edu")
    token_admin, _ = await criar_usuario_e_logar(client, db, "ws3admin@escola.edu", role="admin")

    r = await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token_soli}"},
        json={"user_name": "Soli", "user_id": id_soli, "description": "notebook quebrado"},
    )
    ticket_id = r.json()["id"]

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws?token={token_soli}") as ws:
            _ = ws.receive_json()  # connected

            await client.post(
                f"/chamados/{ticket_id}/comentarios",
                headers={"Authorization": f"Bearer {token_admin}"},
                data={"body": "olá", "is_internal": "false"},
            )

            eventos = []
            while len(eventos) < 2:
                evento = ws.receive_json()
                eventos.append(evento["type"])
            assert "notification" in eventos
            assert "unread_count" in eventos


@pytest.mark.asyncio
async def test_seed_admin_cria_admin_padrao(db):
    from backend.services.seed import seed_admin

    await seed_admin(db)

    from sqlalchemy import select

    result = await db.execute(select(User).where(User.role == "admin"))
    admins = list(result.scalars().all())
    assert len(admins) == 1
    assert admins[0].email == "admin@escola.edu"

    # rodar de novo não duplica
    await seed_admin(db)
    result = await db.execute(select(User).where(User.role == "admin"))
    assert len(list(result.scalars().all())) == 1
