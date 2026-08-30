# Documentação - Call Help

Sistema de chamados de TI desenvolvido como projeto escolar.

## Índice

- [Arquitetura](arquitetura.md) - como o projeto está organizado (MVC)
- [Banco de dados](banco-de-dados.md) - tabelas e relacionamentos
- [API](api-endpoints.md) - rotas do backend
- [Telas](telas.md) - telas do frontend
- [Docker](docker.md) - como rodar com docker-compose
- [TDD](tdd.md) - como rodar os testes

## Resumo

O sistema ajuda a gerenciar chamados de TI. Um usuário abre um chamado
quando algum equipamento dá problema, e o técnico responsável acompanha
até resolver.

Tem duas partes:

- **backend/** - API feita em FastAPI (Python) que segue o padrão MVC
- **frontend/** - Telas feitas em React com Vite

O banco de dados é MariaDB e tudo roda junto com docker-compose.