# Arquitetura

## Visão geral

```
┌─────────────┐      HTTP/JSON      ┌─────────────┐      SQL       ┌──────────┐
│  frontend   │  ──────────────▶   │  backend   │  ──────────▶  │  MariaDB │
│  (React)    │   ◀──────────────  │ (FastAPI)  │  ◄──────────   │          │
└─────────────┘                    └─────────────┘                └──────────┘
```

O frontend faz requisições para o backend, que conversa com o banco de dados.
A autenticação usa JWT: o login devolve um token que o frontend manda nas
próximas requisições.

## Padrão MVC no backend

O backend segue o MVC adaptado para API:

| Camada       | Pasta             | O que faz                                     |
|--------------|-------------------|-----------------------------------------------|
| **Model**    | `models/`         | Tabelas do banco (SQLAlchemy ORM)             |
| **View**     | `controllers/`    | Rotas do FastAPI que recebem e respondem JSON |
| **Controller**| `services/`      | Regras de negócio (valida, calcula, decide)    |
| **Repository**| `repositories/`   | Acesso ao banco (isola o ORM do service)     |
| **Schema**   | `schemas/`        | Pydantic - valida entrada e saída de dados    |

Fluxo de uma requisição:

```
request → controller → service → repository → model → banco
                                                 ↓
response ← controller ← service ← repository ← model ← banco
```

Exemplo: criar um chamado

1. `POST /chamados` chega no `controllers/tickets.py`
2. O controller valida os dados com o schema Pydantic
3. Chama `services/ticket_service.py` que aplica a regra de negócio
4. O service usa `repositories/ticket_repo.py` para salvar no banco
5. O repository faz o INSERT usando o model `models/ticket.py`
6. A resposta volta como JSON

## Autenticação

- Login com email e senha
- Senha é guardada com hash bcrypt (nunca em texto puro)
- Login retorna um token JWT com 120 minutos de validade
- O token guarda o id do usuário e o papel (admin ou comum)
- Rotas protegidas exigem o token no header: `Authorization: Bearer <token>`
- Algumas rotas (cadastrar usuários e equipamentos) exigem papel admin