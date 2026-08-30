# Telas do frontend

O frontend tem 6 telas principais. Todas são protegidas por login, exceto
a própria tela de login.

## 1. Login (`/login`)

Tela inicial. Campos email e senha. Ao logar com sucesso, guarda o token
JWT e redireciona para o dashboard.

## 2. Dashboard (`/`)

Mostra um resumo dos chamados:

- Quantidade de chamados abertos
- Quantidade em andamento
- Quantidade resolvidos

Também pode listar os chamados recentes.

## 3. Abrir chamado (`/chamados/novo`)

Formulário para abrir um chamado novo. Campos:

- Nome do usuário (user_name)
- Equipamento (select com os equipamentos cadastrados)
- Local
- Setor
- Tipo do problema
- Descrição
- Prioridade (baixa / media / alta)
- Data

Ao submeter, cria o chamado e volta para a lista.

## 4. Lista de chamados (`/chamados`)

Lista todos os chamados em uma tabela. Mostra:

- ID
- Usuário
- Equipamento
- Setor
- Status
- Prioridade
- Data

Tem um campo de busca para pesquisar chamados e um filtro por status.

## 5. Equipamentos (`/equipamentos`)

Só admin acessa. Lista os equipamentos cadastrados e permite:

- Cadastrar equipamento novo
- Editar equipamento
- Remover equipamento

## 6. Usuários (`/usuarios`)

Só admin acessa. Lista os usuários e permite:

- Cadastrar usuário novo (com papel admin ou comum)
- Editar usuário
- Remover usuário

## Navegação

Um menu lateral (sidebar) aparece em todas as telas logadas com links para:

- Dashboard
- Abrir chamado
- Lista de chamados
- Equipamentos (só aparece se for admin)
- Usuários (só aparece se for admin)
- Sair