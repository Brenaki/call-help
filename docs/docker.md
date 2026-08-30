# Docker - Como rodar o projeto

## Pré-requisitos

- Docker instalado
- Docker Compose instalado

## Rodando tudo

Na pasta raiz do projeto (onde está o `docker-compose.yml`):

```bash
docker compose up --build
```

Isso sobe três serviços:

| Serviço   | Porta | O que é               |
|-----------|-------|-----------------------|
| db        | 3306  | banco MariaDB         |
| backend   | 8000  | API FastAPI           |
| frontend  | 8080  | telas React (nginx)   |

Depois de subir:

- Frontend: http://localhost:8080
- Backend (API): http://localhost:8000
- Docs da API (Swagger): http://localhost:8000/docs

## Parar

```bash
docker compose down
```

## Parar e apagar o banco

```bash
docker compose down -v
```

## Variáveis de ambiente

Copie o `.env.example` para `.env` e ajuste se quiser mudar senhas ou
configurações:

```bash
cp .env.example .env
```