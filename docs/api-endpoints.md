# API — Endpoints e contratos

Exceto `POST /login` e `GET /`, as rotas HTTP exigem `Authorization: Bearer <token>`. A documentação interativa também está em `/docs` quando o backend está em execução.

## Autenticação e cadastros

| Método e rota | Acesso | Descrição |
|---|---|---|
| `POST /login` | público | autentica e devolve JWT e papel |
| `GET, POST, PUT, DELETE /usuarios` | admin | consulta e mantém usuários (`PUT`/`DELETE` recebem `/{id}`) |
| `GET, POST, PUT, DELETE /equipamentos` | admin | consulta e mantém equipamentos (`PUT`/`DELETE` recebem `/{id}`) |

Exemplo de login:

```json
{ "email": "admin@escola.edu", "password": "123456" }
```

## Chamados

| Método e rota | Descrição |
|---|---|
| `GET /chamados` | lista; aceita `status`, `scope=meus` (admin) e `q` |
| `GET /chamados/busca?q=texto` | busca textual |
| `GET /chamados/{id}` | detalhe, respeitando visibilidade |
| `POST /chamados` | cria; o solicitante é sempre o usuário autenticado |
| `PUT /chamados/{id}` | edita prioridade/status legado permitido pelo contrato original |
| `PUT /chamados/{id}/status` | aplica uma transição válida |
| `PUT /chamados/{id}/atribuir` | atribui o técnico; somente admin |

Para mudar status, envie:

```json
{ "status": "aguardando_cliente" }
```

## Máquina de estados

| Estado atual | Próximos estados | Quem pode executar |
|---|---|---|
| `aberto` | `em_andamento` | admin |
| `em_andamento` | `aguardando_cliente`, `resolvido` | admin |
| `aguardando_cliente` | `em_andamento`, `resolvido` | solicitante/admin; resolver é admin |
| `resolvido` | `em_andamento`, `fechado` | reabrir: solicitante/admin; fechar: solicitante |
| `fechado` | `em_andamento` | admin |

Cada transição registra um evento. Comentário público da TI em chamado aberto muda automaticamente para `em_andamento`; resposta pública do solicitante em `aguardando_cliente` também retoma o atendimento.

## Conversa e anexos

| Método e rota | Descrição |
|---|---|
| `GET /chamados/{id}/comentarios` | retorna conversa; usuário comum não recebe notas internas |
| `POST /chamados/{id}/comentarios` | envia `multipart/form-data` com `body`, `is_internal` e `files` opcionais |
| `GET /chamados/{id}/eventos` | histórico de mudanças |
| `GET /anexos/{id}` | baixa anexo autorizado |

O limite é 5 MB por arquivo. Tipos aceitos: PNG, JPEG, GIF, WebP, PDF, TXT, ZIP, DOCX e XLSX. Tipos inválidos retornam 415; arquivo acima do limite retorna 413.

## Notificações e WebSocket

| Método e rota | Descrição |
|---|---|
| `GET /notificacoes` | lista avisos do usuário atual |
| `GET /notificacoes/nao-lidas` | retorna `{ "count": n }` |
| `PUT /notificacoes/{id}/ler` | marca um aviso como lido |
| `PUT /notificacoes/ler-todas` | marca todos como lidos |
| `WS /ws?token=<JWT>` | conexão em tempo real autenticada |

Eventos WS: `connected`, `comment`, `status_change`, `assignment`, `notification` e `unread_count`. Token ausente ou inválido fecha a conexão com código 4401.

Erros de regra retornam 403 (sem permissão), 404 (recurso ausente), 413 (arquivo grande), 415 (tipo não aceito) ou 422 (dados/transição inválidos).
