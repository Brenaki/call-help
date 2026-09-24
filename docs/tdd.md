# Qualidade e TDD

O desenvolvimento segue o ciclo TDD: escrever o teste que falha, implementar o mínimo necessário e refatorar preservando a suíte verde. Os testes cobrem regras de chamados, conversa, anexos, transições, WebSocket e telas React.

## Backend

```bash
cd backend
uv sync --extra dev
uv run pytest
```

Os testes usam pytest, httpx e pytest-asyncio. Quando a suíte precisar da infraestrutura real, inicie o banco com `docker compose up -d db` a partir da raiz.

## Frontend

```bash
cd frontend
npm install
npm run test -- --run
npm run build
```

Vitest e Testing Library verificam os componentes. `npm run build` é obrigatório na entrega porque também executa o typecheck do TypeScript antes do build Vite.

## Verificações recomendadas antes da entrega

1. Rodar testes do backend e frontend.
2. Rodar `npm run build` no frontend.
3. Subir `docker compose up --build`.
4. Executar o roteiro de [validação integrada](validacao.md).
