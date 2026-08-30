# TDD - Como rodar os testes

O projeto usa TDD (Test Driven Development): primeiro escreve o teste,
depois implementa até passar, e depois refatora.

## Backend (pytest)

Os testes do backend ficam em `backend/tests/`.

### Rodar todos os testes

```bash
cd backend
uv run pytest
```

### Rodar um arquivo de teste só

```bash
uv run pytest tests/test_auth.py
```

### Rodar por nome (keyword)

```bash
uv run pytest -k "login"
```

### Ver saida detalhada

```bash
uv run pytest -v
```

Os testes do backend rodam contra um MariaDB que sobe no docker-compose.
Para os testes rodarem o banco precisa estar de pé:

```bash
docker compose up -d db
```

## Frontend (Vitest)

Os testes do frontend ficam em `frontend/src/__tests__/`.

### Rodar todos os testes (uma vez)

```bash
cd frontend
npm run test -- --run
```

### Rodar em modo watch (recarrega ao salvar)

```bash
npm run test
```

### Rodar um arquivo de teste

```bash
npm run test -- --run NewTicket
```

## Ciclo TDD

1. **Vermelho** - escreve o teste e roda, ele falha (ainda não implementou)
2. **Verde** - implementa o mínimo para o teste passar
3. **Refatora** - melhora o código mantendo os testes passando