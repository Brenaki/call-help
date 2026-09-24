# Documentação — Call Help

O Call Help é um sistema web para registrar e acompanhar chamados de suporte de TI em escolas e empresas. O solicitante abre e acompanha o chamado; a equipe de TI conversa, atribui o atendimento e registra a resolução em tempo real.

## Índice

- [Arquitetura](arquitetura.md) — componentes, MVC, autenticação e tempo real
- [Banco de dados](banco-de-dados.md) — tabelas, relacionamentos e migration
- [API](api-endpoints.md) — contratos HTTP, WebSocket, permissões e transições
- [Telas](telas.md) — fluxos e comportamento responsivo do frontend
- [Docker](docker.md) — execução integrada e variáveis de ambiente
- [TDD](tdd.md) — estratégia e comandos de testes
- [Validação](validacao.md) — evidências de teste integrado e roteiro de demonstração

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript, Vite, Vitest |
| Backend | Python 3.13, FastAPI, SQLAlchemy assíncrono, Pydantic |
| Banco | MariaDB 11, Alembic |
| Autenticação | JWT e bcrypt |
| Infraestrutura | Docker Compose, nginx |

## Estrutura do repositório

```text
backend/    API FastAPI organizada em MVC
frontend/   SPA React
docs/       documentação do projeto
docker-compose.yml  orquestra banco, API e interface
```

Para iniciar o sistema, consulte [Docker](docker.md). Para a apresentação do TCC, a sequência sugerida está em [Validação](validacao.md).
