# Arquitetura

## Visão geral

```text
Navegador (React)
       │ HTTP/JSON e WebSocket
       ▼
nginx (frontend, porta 8080)
       │ /api/* e /api/ws
       ▼
FastAPI (backend, porta 8000) ───── SQL assíncrono ─────► MariaDB 11
       │
       └── volume Docker para anexos
```

Em desenvolvimento, o frontend pode acessar a API em `http://localhost:8000`. No ambiente Docker, `VITE_API_URL=/api` faz o nginx encaminhar HTTP para o backend e atualizar a conexão WebSocket em `/api/ws`.

## Backend: MVC adaptado para API

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Model | `models/` | mapeamento ORM das tabelas |
| Controller (rotas) | `controllers/` | recebe a requisição e devolve a resposta HTTP/WS |
| Service | `services/` | regras de negócio, permissões, notificações e transições |
| Repository | `repositories/` | consultas e persistência com SQLAlchemy |
| Schema | `schemas/` | validação e serialização com Pydantic |

Fluxo: `requisição → controller → service → repository → model → MariaDB`. Essa separação reduz o acoplamento e torna regras como a máquina de estados testáveis sem depender da tela.

## Autenticação e autorização

O login compara a senha com hash bcrypt e devolve um JWT com identificador e papel do usuário. O token é enviado em `Authorization: Bearer <token>` para HTTP e no parâmetro `token` da conexão WebSocket.

- Usuário `comum`: vê apenas seus chamados, comentários públicos e pode confirmar o fechamento de um chamado resolvido.
- Usuário `admin` (equipe de TI): vê todos os chamados, administra usuários/equipamentos, atribui técnicos, cria notas internas e realiza transições técnicas.
- O seed cria o administrador configurado em `ADMIN_EMAIL` e `ADMIN_PASSWORD` somente quando ele ainda não existe.

## Tempo real e notificações

O `ConnectionManager` mantém conexões por usuário. O backend envia eventos `comment`, `status_change`, `assignment`, `notification` e `unread_count` aos destinatários pertinentes. O cliente React mostra o estado da conexão e tenta reconectar a cada 10 segundos; se receber o fechamento 4401, remove o token expirado e retorna ao login. Não há polling.

## Anexos

`StorageProvider` é uma interface para armazenamento. A implementação atual é local e persiste no volume `uploads_data`; o contrato permite acrescentar S3 sem alterar a regra de negócio. O servidor gera nome interno UUID, impede path traversal e só libera download a admin, autor do upload ou dono do chamado.
