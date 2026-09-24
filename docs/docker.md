# Docker — Execução integrada

Na raiz do repositório, copie o exemplo de variáveis e suba os serviços:

```bash
cp .env.example .env
docker compose up --build
```

| Serviço | Porta local | Responsabilidade |
|---|---:|---|
| `db` | 3306 | MariaDB 11 com volume `db_data` |
| `backend` | 8000 | FastAPI, migrations no startup e volume `uploads_data` |
| `frontend` | 8080 | build React servido por nginx |

Endereços: interface em `http://localhost:8080`, API em `http://localhost:8000` e Swagger em `http://localhost:8000/docs`.

O nginx serve a SPA, redireciona `/api/` ao backend e mantém o upgrade da conexão para `/api/ws`. Dessa forma, o frontend em container usa a mesma origem e o WebSocket funciona atrás do proxy.

## Variáveis relevantes

- `DATABASE_URL`, `MYSQL_*`: conexão e credenciais do MariaDB.
- `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES`: segurança do token.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: administrador criado automaticamente se inexistente.
- `STORAGE_BACKEND`, `UPLOAD_DIR`, `MAX_UPLOAD_MB`: armazenamento e limite de anexo.
- `VITE_API_URL`: em Docker use `/api`; em desenvolvimento direto use `http://localhost:8000`.

Não utilize os valores de exemplo como segredos de produção.

```bash
docker compose down       # para, preservando volumes
docker compose down -v    # para e remove banco/anexos locais
```
