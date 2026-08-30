# Banco de dados - MariaDB

## Tabelas

### users (usuários)

Guarda as pessoas que usam o sistema.

| campo          | tipo                          | descrição                    |
|----------------|-------------------------------|------------------------------|
| id             | INT PK AUTO_INCREMENT         | identificador                |
| name           | VARCHAR(100) NOT NULL         | nome do usuário              |
| email          | VARCHAR(150) UNIQUE NOT NULL  | usado no login               |
| password_hash  | VARCHAR(255) NOT NULL         | senha com hash bcrypt        |
| role           | ENUM('admin','comum')         | admin cadastra, comum abre   |
| sector         | VARCHAR(50)                   | setor ex: Informatica        |
| created_at     | DATETIME DEFAULT NOW()         | quando cadastrou             |

### equipments (equipamentos)

| campo         | tipo                          | descrição                    |
|---------------|-------------------------------|------------------------------|
| id            | INT PK AUTO_INCREMENT         | identificador                |
| name          | VARCHAR(100) NOT NULL         | ex: Computador da sala 2     |
| type          | VARCHAR(50)                   | ex: Desktop, Notebook        |
| localization  | VARCHAR(100)                  | ex: Laboratorio 2            |
| created_at    | DATETIME DEFAULT NOW()         | quando cadastrou             |

### tickets (chamados)

| campo           | tipo                                          | descrição                       |
|-----------------|-----------------------------------------------|---------------------------------|
| id              | INT PK AUTO_INCREMENT                         | identificador                   |
| user_id         | INT FK → users.id                             | quem abriu                      |
| equipment_id    | INT FK → equipments.id NULL                   | equipamento com problema         |
| user_name       | VARCHAR(100)                                  | nome do usuário (cópia)         |
| equipment_name   | VARCHAR(100)                                  | nome do equipamento (cópia)     |
| sector          | VARCHAR(50)                                   | setor                           |
| localization    | VARCHAR(100)                                  | local                           |
| problem_type    | VARCHAR(80)                                   | tipo do problema                |
| description     | TEXT                                          | descrição do problema           |
| priority        | ENUM('baixa','media','alta')                  | prioridade                      |
| status          | ENUM('aberto','em_andamento','resolvido')     | status atual                    |
| technical_lead  | VARCHAR(100) NULL                             | técnico responsável             |
| date            | DATE                                          | data de abertura                |
| created_at      | DATETIME DEFAULT NOW()                        | timestamp                       |

## Relacionamentos

```
users 1 ──────< N tickets
equipments 1 ──< N tickets
```

Um usuário pode abrir vários chamados. Um equipamento pode aparecer em
vários chamados. Cada chamado pertence a um usuário e (opcionalmente) a
um equipamento.

## Migrations

As tabelas são criadas com Alembic. Para gerar uma migration nova:

```bash
cd backend
uv run alembic revision --autogenerate -m "descreve a mudanca"
```

Para aplicar as migrations no banco:

```bash
uv run alembic upgrade head
```