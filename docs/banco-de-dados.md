# Banco de dados — MariaDB

## Entidades principais

| Tabela | Finalidade |
|---|---|
| `users` | pessoas autenticadas, papel e setor |
| `equipments` | equipamentos cadastrados |
| `rooms` | salas e ambientes cadastrados |
| `room_equipments` | associação N:N entre salas e equipamentos |
| `tickets` | chamado e seu estado atual |
| `ticket_comments` | conversa pública e notas internas |
| `attachments` | metadados de arquivos enviados em comentários |
| `ticket_events` | histórico auditável de status e atribuição |
| `notifications` | avisos persistidos e estado de leitura |

## Relacionamentos

```text
users 1 ──< tickets (user_id: solicitante)
users 1 ──< tickets (assigned_to: técnico)
equipments 1 ──< tickets
rooms N ──< room_equipments >── N equipments
tickets 1 ──< ticket_comments 1 ──< attachments
tickets 1 ──< ticket_events
tickets 1 ──< notifications
users 1 ──< ticket_comments, ticket_events e notifications
```

## Campos relevantes de `tickets`

Além de descrição, prioridade, setor, local e equipamento, o chamado possui `user_id`, `assigned_to`, `status`, `created_at`, `updated_at` e `closed_at`. Os cinco valores possíveis de `status` são `aberto`, `em_andamento`, `aguardando_cliente`, `resolvido` e `fechado`.

Um equipamento pode ser associado a várias salas e uma sala pode conter vários equipamentos. A tabela associativa `room_equipments` materializa essa relação.

`ticket_comments.is_internal` protege observações exclusivas da equipe de TI. `attachments` guarda nome original, nome interno, tipo MIME, tamanho, autor e ligação com chamado/comentário; o conteúdo fica fora do banco, no provider de armazenamento.

## Integridade e histórico

As tabelas de comentário, eventos, anexos e notificações usam chaves estrangeiras para ticket e/ou usuário. Ao remover um chamado, comentários, eventos, anexos e notificações associados são removidos por cascata. O histórico não depende do texto exibido na interface: cada mudança de status ou atribuição gera um registro em `ticket_events`.

## Migration

A migration `12c283bfa408_adiciona_conversa_eventos_anexos_.py` adiciona as entidades de conversa, anexos, eventos e notificações, a atribuição de técnico e os dois novos estados do chamado.

```bash
cd backend
uv run alembic upgrade head
```

Para criar uma alteração futura:

```bash
uv run alembic revision --autogenerate -m "descreve a mudanca"
```
