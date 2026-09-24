# Validação integrada e roteiro de demonstração

## Evidência de validação realizada em 24/09/2026

Com os três containers ativos, foi validado o fluxo completo: login do administrador criado pelo seed, criação de chamado, comentário da TI com transição automática para `em_andamento`, envio e download de anexo TXT, transições para `aguardando_cliente` e `resolvido`, e fechamento pelo solicitante com preenchimento de `closed_at`.

Também foram verificados: resposta 200 da SPA, proxy HTTP `/api/`, handshake WebSocket via nginx em `/api/ws`, recebimento real de `notification`, `unread_count` e `comment` por uma usuária comum, além do comportamento visual das telas de dashboard/detalhe e do layout de 375 px sem overflow horizontal. Esta evidência vem do ciclo E2E anterior registrado no workstream do projeto; repita o roteiro abaixo para uma nova entrega.

## Roteiro para banca

1. Execute `docker compose up --build` e abra `http://localhost:8080`.
2. Entre com o administrador configurado no `.env` (os valores de exemplo são `admin@escola.edu` e `123456`).
3. Cadastre, se necessário, uma usuária comum e abra um chamado como ela.
4. Como admin, abra o chamado na lista, atribua um técnico e envie uma resposta pública com anexo.
5. Mostre que o chamado muda de `aberto` para `em_andamento`, o histórico registra a ação e a notificação chega ao solicitante.
6. Mova para `aguardando_cliente` e depois `resolvido`.
7. Entre como solicitante, abra a notificação e use “Confirmar e fechar”.
8. Mostre o status `fechado`, o histórico e a seção “Aguardando você” no dashboard.
9. Redimensione o navegador para 375 px e demonstre o drawer e a tela de detalhe em uma coluna.

## Critérios de aceite cobertos

| Requisito | Evidência |
|---|---|
| Conversa e anexos | comentário multipart, download autorizado e validação de 5 MB/tipos |
| Processo de atendimento | máquina de cinco estados, permissões e eventos |
| Colaboração | técnico atribuído, notas internas e escopo Meus/Todos |
| Tempo real | WebSocket JWT, reconexão e sino sem polling |
| Implantação | nginx para API/WS, volumes e Docker Compose |
| Interface | detalhe completo, badges e responsividade móvel |
