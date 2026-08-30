# AGENTS.md

This is a multi-component workspace, **not** a monorepo: there is no root manifest and no shared lockfile. Each sub-project is independent with its own toolchain. Everything runs together via `docker-compose.yml` at the root.

## Layout

- `backend/` — Python 3.13 + FastAPI service, managed with `uv`. Package source under `src/backend/` (MVC layout). Own Dockerfile. Uses MariaDB via Docker.
- `frontend/` — React 19 + Vite 8 + TypeScript 6 SPA, managed with npm. Own Dockerfile + nginx config (serves static build).
- `docs/` — all project documentation (arquitetura, banco, api, telas, docker, tdd).
- `docker-compose.yml` — orquestra db (MariaDB 11) + backend + frontend.
- `.env.example` — vars de ambiente (copiar para `.env`).

Run commands from inside the relevant sub-project directory, not from the workspace root.

## backend (FastAPI / uv / MVC)

- Python `>=3.13` (pinned via `.python-version`), dependencies via `uv`.
- **Package lives at `src/backend/`** (not `src/main.py` anymore). The FastAPI `app` is in `src/backend/main.py`.
- **MVC layout**: `models/` (SQLAlchemy ORM), `controllers/` (FastAPI routers = views), `services/` (business rules), `repositories/` (DB access), `schemas/` (Pydantic DTOs).
- DB: MariaDB via async SQLAlchemy (`aiomysql` driver). Engine + session in `src/backend/database.py`. Migrations via Alembic (`alembic/`).
- Auth: JWT (`python-jose`) + bcrypt (`passlib`). Settings from env via `pydantic-settings` in `src/backend/config.py`.
- Dev server: `uv run uvicorn src.backend.main:app --reload` (run from `backend/`).
- Sync deps: `uv sync --extra dev` (dev deps include pytest, httpx, pytest-asyncio).
- Tests: `uv run pytest` (TDD — tests em `tests/`). Needs db up: `docker compose up -d db`.
- Migrations: `uv run alembic revision --autogenerate -m "msg"` / `uv run alembic upgrade head`.
- `alembic.ini` has `prepend_sys_path = . src` so Alembic finds the `backend` package.

## frontend (React + Vite + TS + Vitest)

- Scripts (`npm run ...`): `dev`, `build`, `lint`, `preview`, `test` (vitest).
- `build` runs `tsc -b && vite build` — typecheck failures fail the build. Run `npm run build` to verify types; `npm run lint` is eslint-only and does **not** typecheck.
- TS is in bundler mode with `noEmit`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`, `noUnusedParameters`. Use `import type` for type-only imports and avoid unused vars — they are hard errors.
- Entry: `index.html` → `src/main.tsx` → `src/App.tsx`.
- Tests: Vitest + @testing-library/react + jsdom. Test files em `src/__tests__/`. Run: `npm run test -- --run`.
- Dockerfile is multi-stage (node:22-alpine build → nginx:alpine serve). `nginx.conf` proxies `/api/` to backend.
- `VITE_API_URL` env var sets backend base URL (see `.env.example`).

## docker-compose

- `db`: mariadb:11, healthcheck via `healthcheck.sh`, volume `db_data`.
- `backend`: builds `backend/Dockerfile`, runs `alembic upgrade head` then uvicorn on port 8000, waits for db healthy.
- `frontend`: builds `frontend/Dockerfile`, nginx on port 80 (exposed as 8080), depends on backend.
- Start: `docker compose up --build`. Stop: `docker compose down`. Reset DB: `docker compose down -v`.

## Conventions

- Commits em português, curtos, estilo aluno (ex: `cria tela de login`, `ajusta testes do backend`).
- TDD: vermelho (teste falha) → verde (implementa) → refatora.
- LSP pode não enxergar o `.venv` do uv — confirme com `uv run python -c "import ..."` antes de confiar em erros de import do editor.