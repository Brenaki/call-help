# Call Help - Sistema de Chamados de TI

Sistema de chamados de TI feito como projeto escolar.

## O que o sistema faz

- Login com email e senha
- Dashboard com chamados abertos, em andamento e resolvidos
- Abrir chamado (nome, equipamento, local, setor, tipo do problema, descricao, prioridade)
- Listar e buscar chamados
- Cadastrar equipamentos (so admin)
- Cadastrar usuarios (so admin)

## Tecnologias

- **Backend**: FastAPI (Python) com padrao MVC, SQLAlchemy, Alembic, JWT
- **Frontend**: React + Vite + TypeScript
- **Banco**: MariaDB
- **Testes**: pytest (backend) + Vitest (frontend) - TDD
- **Docker**: docker-compose sobe tudo

## Como rodar

```bash
docker compose up --build
```

Depois acessar:
- Frontend: http://localhost:8080
- Backend (API): http://localhost:8000
- Docs da API: http://localhost:8000/docs

## Como rodar os testes

```bash
# Backend
cd backend
uv run pytest

# Frontend
cd frontend
npm run test -- --run
```

## Documentacao

Toda a documentacao esta na pasta `docs/`:

- `arquitetura.md` - como o projeto esta organizado
- `banco-de-dados.md` - tabelas e relacionamentos
- `api-endpoints.md` - rotas do backend
- `telas.md` - telas do frontend
- `docker.md` - como rodar com docker
- `tdd.md` - como rodar os testes

## Estrutura

```
call-help/
├── backend/      # FastAPI + MVC (src/backend/)
├── frontend/      # React + Vite
├── docs/          # documentacao
├── docker-compose.yml
└── .env.example
```