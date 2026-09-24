# Telas e experiência de uso

Todas as telas, exceto `/login`, exigem sessão autenticada. O menu lateral contém Dashboard, Novo chamado, Chamados e, para admin, Equipamentos e Usuários. Em tela estreita ele se torna um drawer, evitando rolagem horizontal.

| Rota | Tela | Recursos principais |
|---|---|---|
| `/login` | Login | autenticação JWT |
| `/` | Dashboard | cinco cartões por status, recentes e seção “Aguardando você” |
| `/chamados/novo` | Novo chamado | formulário com prioridade, equipamento e localização |
| `/chamados` | Lista | busca, filtros, escopo Meus/Todos e badges dos cinco status |
| `/chamados/:id` | Detalhe | conversa, histórico, anexos, ações e atribuição |
| `/equipamentos` | Equipamentos | CRUD administrativo |
| `/salas` | Salas | associa várias salas a vários equipamentos |
| `/usuarios` | Usuários | CRUD administrativo |

## Detalhe do chamado

A tela centraliza o atendimento: mensagem inicial, conversa cronológica, histórico de eventos e painel de ações. Administradores podem atribuir o técnico, enviar nota interna e executar as transições técnicas. O solicitante vê somente conteúdo público e, após `resolvido`, recebe a ação “Confirmar e fechar”.

O compositor aceita arquivos por seleção, arrastar/soltar e colagem de imagem. A interface avisa o limite de 5 MB e apresenta links de download para arquivos anexados.

## Cadastro inteligente

Nos formulários de equipamento e chamado, campos de tipo, local e setor oferecem valores já cadastrados, mas permanecem livres para registrar um valor novo. Ao abrir chamado, solicitantes comuns têm o nome preenchido pela conta autenticada; a equipe de TI pode selecionar outro solicitante. O cadastro de usuário informa a senha padrão e a troca obrigatória no primeiro login.

## Tempo real e notificações

O topo mostra o estado da conexão (“Conectado”, “Conectando”, “Reconectando” ou “Fechado”). O sino apresenta a quantidade de notificações não lidas recebidas pelo WebSocket. Ao abrir uma notificação, o usuário é direcionado ao chamado e o aviso é marcado como lido.

## Responsividade e acessibilidade

Em dispositivos móveis, a grade do detalhe passa para uma coluna, o painel lateral vira drawer e a conversa permanece legível sem overflow horizontal. A aplicação usa rótulos, regiões e botões semânticos nas interações principais para melhorar o uso com leitor de tela e teclado.
