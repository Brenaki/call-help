"""Testes de conversa (comentários) e transições de status."""

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


async def criar_chamado(client, token, user_id, descricao="Sem internet"):
    response = await client.post(
        "/chamados",
        headers={"Authorization": f"Bearer {token}"},
        json={"user_name": "Solicitante", "user_id": user_id, "description": descricao},
    )
    return response.json()["id"]


@pytest.mark.asyncio
async def test_adicionar_e_listar_comentarios(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv1@escola.edu")
    ticket_id = await criar_chamado(client, token_soli, id_soli)

    await client.post(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_soli}"},
        data={"body": "Segue print do erro", "is_internal": "false"},
    )
    response = await client.get(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_soli}"},
    )
    assert response.status_code == 200
    comentarios = response.json()
    assert len(comentarios) == 1
    assert comentarios[0]["body"] == "Segue print do erro"
    assert comentarios[0]["author_name"] == "Usuario cv1"


@pytest.mark.asyncio
async def test_nota_interna_invisivel_para_solicitante(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv2@escola.edu")
    token_admin, _ = await criar_usuario_e_logar(client, db, "cv2admin@escola.edu", role="admin")
    ticket_id = await criar_chamado(client, token_soli, id_soli)

    await client.post(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_admin}"},
        data={"body": "Nota interna da TI", "is_internal": "true"},
    )
    response_soli = await client.get(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_soli}"},
    )
    response_admin = await client.get(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert len(response_soli.json()) == 0
    assert len(response_admin.json()) == 1
    assert response_admin.json()[0]["is_internal"] is True


@pytest.mark.asyncio
async def test_comum_nao_pode_criar_nota_interna(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv3@escola.edu")
    ticket_id = await criar_chamado(client, token_soli, id_soli)

    response = await client.post(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_soli}"},
        data={"body": "tentativa de nota interna", "is_internal": "true"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_comum_so_ve_proprios_chamados(client, db):
    token_a, id_a = await criar_usuario_e_logar(client, db, "cv4a@escola.edu")
    token_b, id_b = await criar_usuario_e_logar(client, db, "cv4b@escola.edu")
    await criar_chamado(client, token_a, id_a, "problema do usuario A")

    response = await client.get(
        "/chamados",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert response.status_code == 200
    assert all(c["user_id"] == id_b for c in response.json())


@pytest.mark.asyncio
async def test_admin_ve_todos_e_scope_meus(client, db):
    token_a, id_a = await criar_usuario_e_logar(client, db, "cv5a@escola.edu")
    token_admin, id_admin = await criar_usuario_e_logar(
        client, db, "cv5admin@escola.edu", role="admin"
    )
    await criar_chamado(client, token_a, id_a, "problema do usuario A")
    await criar_chamado(client, token_admin, id_admin, "chamado do admin")

    response_todos = await client.get(
        "/chamados",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    response_meus = await client.get(
        "/chamados?scope=meus",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert len(response_todos.json()) == 2
    assert len(response_meus.json()) == 1
    assert response_meus.json()[0]["user_id"] == id_admin


@pytest.mark.asyncio
async def test_primeiro_comentario_ti_move_para_em_andamento(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv6@escola.edu")
    token_admin, admin_id = await criar_usuario_e_logar(client, db, "cv6admin@escola.edu", role="admin")
    ticket_id = await criar_chamado(client, token_soli, id_soli)

    response = await client.post(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_admin}"},
        data={"body": "Estamos verificando", "is_internal": "false"},
    )
    assert response.status_code == 201
    assert response.json()["ticket_status"] == "em_andamento"
    ticket = await client.get(f"/chamados/{ticket_id}", headers={"Authorization": f"Bearer {token_admin}"})
    assert ticket.json()["assigned_to"] == admin_id


@pytest.mark.asyncio
async def test_resposta_solicitante_volta_para_em_andamento(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv7@escola.edu")
    token_admin, _ = await criar_usuario_e_logar(client, db, "cv7admin@escola.edu", role="admin")
    ticket_id = await criar_chamado(client, token_soli, id_soli)
    auth_admin = {"Authorization": f"Bearer {token_admin}"}

    await client.put(f"/chamados/{ticket_id}/status", headers=auth_admin, json={"status": "em_andamento"})
    await client.put(f"/chamados/{ticket_id}/status", headers=auth_admin, json={"status": "aguardando_cliente"})
    response = await client.post(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_soli}"},
        data={"body": "continua acontecendo", "is_internal": "false"},
    )
    assert response.status_code == 201
    assert response.json()["ticket_status"] == "em_andamento"


@pytest.mark.asyncio
async def test_fluxo_completo_de_status(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv8@escola.edu")
    token_admin, _ = await criar_usuario_e_logar(client, db, "cv8admin@escola.edu", role="admin")
    ticket_id = await criar_chamado(client, token_soli, id_soli)
    auth_admin = {"Authorization": f"Bearer {token_admin}"}
    auth_soli = {"Authorization": f"Bearer {token_soli}"}

    # aberto -> em_andamento (TI)
    r = await client.put(f"/chamados/{ticket_id}/status", headers=auth_admin, json={"status": "em_andamento"})
    assert r.status_code == 200 and r.json()["status"] == "em_andamento"

    # em_andamento -> aguardando_cliente (TI)
    r = await client.put(f"/chamados/{ticket_id}/status", headers=auth_admin, json={"status": "aguardando_cliente"})
    assert r.status_code == 200 and r.json()["status"] == "aguardando_cliente"

    # aguardando_cliente -> resolvido (TI)
    r = await client.put(f"/chamados/{ticket_id}/status", headers=auth_admin, json={"status": "resolvido"})
    assert r.status_code == 200 and r.json()["status"] == "resolvido"

    # TI nao pode fechar (so o solicitante fecha)
    r = await client.put(f"/chamados/{ticket_id}/status", headers=auth_admin, json={"status": "fechado"})
    assert r.status_code == 403

    # resolvido -> fechado (solicitante)
    r = await client.put(f"/chamados/{ticket_id}/status", headers=auth_soli, json={"status": "fechado"})
    assert r.status_code == 200 and r.json()["status"] == "fechado"
    assert r.json()["closed_at"] is not None

    # fechado -> em_andamento: so admin reabre
    r = await client.put(f"/chamados/{ticket_id}/status", headers=auth_soli, json={"status": "em_andamento"})
    assert r.status_code == 403
    r = await client.put(f"/chamados/{ticket_id}/status", headers=auth_admin, json={"status": "em_andamento"})
    assert r.status_code == 200 and r.json()["status"] == "em_andamento"


@pytest.mark.asyncio
async def test_transicao_invalida_rejeitada(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv9@escola.edu")
    ticket_id = await criar_chamado(client, token_soli, id_soli)

    # aberto -> fechado direto é inválido
    response = await client.put(
        f"/chamados/{ticket_id}/status",
        headers={"Authorization": f"Bearer {token_soli}"},
        json={"status": "fechado"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_solicitante_reabre_resolvido(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv10@escola.edu")
    token_admin, _ = await criar_usuario_e_logar(client, db, "cv10admin@escola.edu", role="admin")
    ticket_id = await criar_chamado(client, token_soli, id_soli)
    auth_admin = {"Authorization": f"Bearer {token_admin}"}
    auth_soli = {"Authorization": f"Bearer {token_soli}"}

    await client.put(f"/chamados/{ticket_id}/status", headers=auth_admin, json={"status": "em_andamento"})
    await client.put(f"/chamados/{ticket_id}/status", headers=auth_admin, json={"status": "resolvido"})
    r = await client.put(f"/chamados/{ticket_id}/status", headers=auth_soli, json={"status": "em_andamento"})
    assert r.status_code == 200 and r.json()["status"] == "em_andamento"


@pytest.mark.asyncio
async def test_comentario_com_anexo(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv11@escola.edu")
    ticket_id = await criar_chamado(client, token_soli, id_soli)

    arquivo = io.BytesIO(b"conteudo do arquivo de teste")
    response = await client.post(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_soli}"},
        data={"body": "segue o log", "is_internal": "false"},
        files={"files": ("erro.txt", arquivo, "text/plain")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["body"] == "segue o log"
    assert len(data["attachments"]) == 1
    assert data["attachments"][0]["file_name"] == "erro.txt"
    assert data["attachments"][0]["size_bytes"] > 0


@pytest.mark.asyncio
async def test_anexo_acima_de_5mb_rejeitado(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv12@escola.edu")
    ticket_id = await criar_chamado(client, token_soli, id_soli)

    conteudo = b"x" * (5 * 1024 * 1024 + 1)
    response = await client.post(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_soli}"},
        data={"body": "arquivo grande", "is_internal": "false"},
        files={"files": ("grande.bin", io.BytesIO(conteudo), "application/octet-stream")},
    )
    assert response.status_code == 413


@pytest.mark.asyncio
async def test_anexo_mime_nao_permitido_rejeitado(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv13@escola.edu")
    ticket_id = await criar_chamado(client, token_soli, id_soli)

    response = await client.post(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_soli}"},
        data={"body": "script malicioso", "is_internal": "false"},
        files={"files": ("malicioso.sh", io.BytesIO(b"rm -rf /"), "application/x-sh")},
    )
    assert response.status_code == 415


@pytest.mark.asyncio
async def test_download_de_anexo_com_permissao(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv14@escola.edu")
    token_outro, _ = await criar_usuario_e_logar(client, db, "cv14outro@escola.edu")
    token_admin, _ = await criar_usuario_e_logar(client, db, "cv14admin@escola.edu", role="admin")
    ticket_id = await criar_chamado(client, token_soli, id_soli)

    arquivo = io.BytesIO(b"dados internos do chamado")
    create = await client.post(
        f"/chamados/{ticket_id}/comentarios",
        headers={"Authorization": f"Bearer {token_soli}"},
        data={"body": "anexo", "is_internal": "false"},
        files={"files": ("dados.txt", arquivo, "text/plain")},
    )
    anexo_id = create.json()["attachments"][0]["id"]

    # dono baixa
    r = await client.get(f"/anexos/{anexo_id}", headers={"Authorization": f"Bearer {token_soli}"})
    assert r.status_code == 200
    assert r.content == b"dados internos do chamado"

    # admin baixa
    r = await client.get(f"/anexos/{anexo_id}", headers={"Authorization": f"Bearer {token_admin}"})
    assert r.status_code == 200

    # terceiro sem relação não baixa
    r = await client.get(f"/anexos/{anexo_id}", headers={"Authorization": f"Bearer {token_outro}"})
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_eventos_registrados_no_historico(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv15@escola.edu")
    token_admin, id_admin = await criar_usuario_e_logar(client, db, "cv15admin@escola.edu", role="admin")
    ticket_id = await criar_chamado(client, token_soli, id_soli)
    auth_admin = {"Authorization": f"Bearer {token_admin}"}

    await client.put(f"/chamados/{ticket_id}/status", headers=auth_admin, json={"status": "em_andamento"})
    response = await client.get(f"/chamados/{ticket_id}/eventos", headers=auth_admin)
    assert response.status_code == 200
    eventos = response.json()
    assert len(eventos) >= 2  # criacao + mudanca de status
    assert eventos[-1]["event_type"] == "status_change"
    assert eventos[-1]["new_value"] == "em_andamento"


@pytest.mark.asyncio
async def test_atribuicao_de_tecnico(client, db):
    token_soli, id_soli = await criar_usuario_e_logar(client, db, "cv16@escola.edu")
    token_admin, _ = await criar_usuario_e_logar(client, db, "cv16admin@escola.edu", role="admin")
    ticket_id = await criar_chamado(client, token_soli, id_soli)
    auth_admin = {"Authorization": f"Bearer {token_admin}"}

    # busca tecnico (admin listado)
    users = await client.get("/usuarios", headers=auth_admin)
    tecnicos = [u for u in users.json() if u["role"] == "admin"]

    r = await client.put(
        f"/chamados/{ticket_id}/atribuir",
        headers=auth_admin,
        json={"assigned_to": tecnicos[0]["id"]},
    )
    assert r.status_code == 200
    assert r.json()["assigned_to"] == tecnicos[0]["id"]

    # comum não atribui
    r = await client.put(
        f"/chamados/{ticket_id}/atribuir",
        headers={"Authorization": f"Bearer {token_soli}"},
        json={"assigned_to": tecnicos[0]["id"]},
    )
    assert r.status_code == 403
