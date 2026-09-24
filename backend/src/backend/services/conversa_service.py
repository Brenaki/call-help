"""Service de conversa - comentários, transições, eventos e notificações."""

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.attachment import Attachment
from backend.models.notification import Notification
from backend.models.ticket import Ticket
from backend.models.ticket_comment import TicketComment
from backend.models.ticket_event import TicketEvent
from backend.models.user import User
from backend.repositories.attachment_repo import AttachmentRepository
from backend.repositories.comment_repo import CommentRepository
from backend.repositories.event_repo import EventRepository
from backend.repositories.notification_repo import NotificationRepository
from backend.services.storage import get_storage, novo_stored_name

# transições válidas por status atual
TRANSICOES: dict[str, set[str]] = {
    "aberto": {"em_andamento"},
    "em_andamento": {"aguardando_cliente", "resolvido"},
    "aguardando_cliente": {"em_andamento", "resolvido"},
    "resolvido": {"em_andamento", "fechado"},
    "fechado": {"em_andamento"},
}

# quem pode executar cada transição: "admin", "solicitante" ou "qualquer"
PERMISSOES_TRANSICAO: dict[tuple[str, str], str] = {
    ("aberto", "em_andamento"): "admin",
    ("em_andamento", "aguardando_cliente"): "admin",
    ("em_andamento", "resolvido"): "admin",
    ("aguardando_cliente", "em_andamento"): "qualquer",
    ("aguardando_cliente", "resolvido"): "admin",
    ("resolvido", "em_andamento"): "qualquer",  # solicitante reabre
    ("resolvido", "fechado"): "solicitante",  # só o dono fecha
    ("fechado", "em_andamento"): "admin",  # só admin reabre fechado
}

ALLOWED_MIMES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "application/zip": ".zip",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
}


class TransicaoInvalida(Exception):
    def __init__(self, mensagem: str, code: int = 422):
        self.mensagem = mensagem
        self.code = code
        super().__init__(mensagem)


class ConversaService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.comment_repo = CommentRepository(db)
        self.event_repo = EventRepository(db)
        self.notification_repo = NotificationRepository(db)
        self.attachment_repo = AttachmentRepository(db)

    def pode_ver_chamado(self, ticket: Ticket, user: User) -> bool:
        return user.role == "admin" or ticket.user_id == user.id

    async def listar_comentarios(self, ticket: Ticket, user: User) -> list[TicketComment]:
        comentarios = await self.comment_repo.list_by_ticket(ticket.id)
        if user.role != "admin":
            comentarios = [c for c in comentarios if not c.is_internal]
        return comentarios

    async def _registrar_evento(
        self, ticket_id: int, user: User, event_type: str,
        old_value: str | None = None, new_value: str | None = None,
    ) -> None:
        await self.event_repo.create(
            TicketEvent(
                ticket_id=ticket_id,
                user_id=user.id,
                event_type=event_type,
                old_value=old_value,
                new_value=new_value,
            )
        )

    async def _notificar(
        self, destinatario_id: int, ticket: Ticket, type_: str, message: str
    ) -> Notification:
        notification = await self.notification_repo.create(
            Notification(
                user_id=destinatario_id,
                ticket_id=ticket.id,
                type=type_,
                message=message,
            )
        )
        # push em tempo real
        from backend.ws import manager

        await manager.send_to_user(
            destinatario_id,
            {"type": "notification", "notification": {
                "id": notification.id,
                "ticket_id": notification.ticket_id,
                "type": notification.type,
                "message": notification.message,
                "is_read": notification.is_read,
                "created_at": str(notification.created_at or ""),
            }},
        )
        unread = await self.notification_repo.unread_count(destinatario_id)
        await manager.send_to_user(
            destinatario_id, {"type": "unread_count", "count": unread}
        )
        return notification

    async def _push(self, user_id: int, payload: dict) -> None:
        from backend.ws import manager

        await manager.send_to_user(user_id, payload)

    async def adicionar_comentario(
        self,
        ticket: Ticket,
        user: User,
        body: str,
        is_internal: bool,
        files: list | None = None,
    ) -> dict:
        if is_internal and user.role != "admin":
            raise TransicaoInvalida("Apenas admin pode criar nota interna", 403)

        old_status = ticket.status

        comment = await self.comment_repo.create(
            TicketComment(
                ticket_id=ticket.id,
                author_id=user.id,
                is_internal=is_internal,
                body=body,
            )
        )

        # anexos
        anexos = []
        if files:
            storage = get_storage()
            for file in files:
                await self._validar_upload(file)
                stored_name = novo_stored_name(file.filename or "arquivo")
                storage.save(stored_name, file.file)
                anexo = await self.attachment_repo.create(
                    Attachment(
                        ticket_id=ticket.id,
                        comment_id=comment.id,
                        file_name=file.filename or stored_name,
                        stored_name=stored_name,
                        mime_type=file.content_type or "application/octet-stream",
                        size_bytes=file.size,
                        uploaded_by=user.id,
                    )
                )
                anexos.append(anexo)

        # transição automática
        novo_status = None
        if (
            not is_internal
            and old_status == "aberto"
            and user.role == "admin"
        ):
            novo_status = "em_andamento"
        elif (
            not is_internal
            and old_status == "aguardando_cliente"
            and ticket.user_id == user.id
        ):
            novo_status = "em_andamento"

        if novo_status:
            ticket.status = novo_status
            self.db.add(ticket)
            await self.db.commit()
            await self._registrar_evento(
                ticket.id, user, "status_change", old_status, novo_status
            )
            if ticket.user_id and ticket.user_id != user.id:
                await self._notificar(
                    ticket.user_id, ticket, "status_change",
                    f"Chamado #{ticket.id} movido para {novo_status}",
                )

        # notificação de novo comentário para a outra parte
        if not is_internal:
            if ticket.user_id and ticket.user_id != user.id:
                await self._notificar(
                    ticket.user_id, ticket, "comment",
                    f"Nova mensagem da TI no chamado #{ticket.id}",
                )
            elif user.role != "admin":
                # comentário do solicitante: notifica técnico atribuído ou admins
                if ticket.assigned_to and ticket.assigned_to != user.id:
                    await self._notificar(
                        ticket.assigned_to, ticket, "comment",
                        f"Nova mensagem no chamado #{ticket.id}",
                    )

        # push do comentário para quem está vendo o chamado
        visualizadores = {ticket.user_id, ticket.assigned_to} - {user.id}
        for vid in visualizadores:
            if vid and user.role == "admin" or (vid == ticket.user_id):
                await self._push(
                    vid,
                    {
                        "type": "comment",
                        "ticket_id": ticket.id,
                        "comment": {
                            "id": comment.id,
                            "ticket_id": comment.ticket_id,
                            "author_id": comment.author_id,
                            "author_name": user.name,
                            "author_role": user.role,
                            "is_internal": comment.is_internal,
                            "body": comment.body,
                            "created_at": str(comment.created_at or ""),
                        },
                    },
                )

        return {
            "comment": comment,
            "attachments": anexos,
            "ticket_status": ticket.status,
        }

    async def _validar_upload(self, file) -> None:
        from backend.config import settings

        max_bytes = settings.max_upload_mb * 1024 * 1024
        if file.size and file.size > max_bytes:
            raise TransicaoInvalida(
                f"Arquivo '{file.filename}' excede o limite de {settings.max_upload_mb} MB", 413
            )
        mime = (file.content_type or "").lower()
        if mime not in ALLOWED_MIMES:
            raise TransicaoInvalida(f"Tipo de arquivo nao permitido: {mime}", 415)

    async def mudar_status(self, ticket: Ticket, user: User, novo_status: str) -> Ticket:
        atual = ticket.status
        if novo_status not in TRANSICOES.get(atual, set()):
            raise TransicaoInvalida(
                f"Transicao invalida: {atual} -> {novo_status}", 422
            )

        permissao = PERMISSOES_TRANSICAO.get((atual, novo_status), "admin")
        if permissao == "solicitante" and ticket.user_id != user.id:
            raise TransicaoInvalida(
                "Apenas o solicitante pode fechar o chamado", 403
            )
        if permissao == "admin" and user.role != "admin":
            raise TransicaoInvalida("Apenas a equipe de TI pode fazer isso", 403)
        if permissao == "qualquer" and user.role != "admin" and ticket.user_id != user.id:
            raise TransicaoInvalida("Sem permissao neste chamado", 403)

        ticket.status = novo_status
        if novo_status == "fechado":
            ticket.closed_at = datetime.now(timezone.utc)
        self.db.add(ticket)
        await self.db.commit()
        await self.db.refresh(ticket)

        await self._registrar_evento(ticket.id, user, "status_change", atual, novo_status)

        # push de mudança de status para as partes
        for vid in {ticket.user_id, ticket.assigned_to} - {user.id}:
            if vid:
                await self._push(
                    vid,
                    {"type": "status_change", "ticket_id": ticket.id, "status": novo_status},
                )

        # notifica a outra parte
        if user.role == "admin" and ticket.user_id and ticket.user_id != user.id:
            await self._notificar(
                ticket.user_id, ticket, "status_change",
                f"Chamado #{ticket.id} movido para {novo_status}",
            )
        elif user.role != "admin" and ticket.assigned_to and ticket.assigned_to != user.id:
            await self._notificar(
                ticket.assigned_to, ticket, "status_change",
                f"Chamado #{ticket.id} movido para {novo_status} pelo solicitante",
            )
        return ticket

    async def atribuir(self, ticket: Ticket, user: User, assigned_to: int) -> Ticket:
        if user.role != "admin":
            raise TransicaoInvalida("Apenas admin pode atribuir chamados", 403)
        old = ticket.assigned_to
        ticket.assigned_to = assigned_to
        self.db.add(ticket)
        await self.db.commit()
        await self.db.refresh(ticket)
        await self._registrar_evento(
            ticket.id, user, "assignment", str(old) if old else None, str(assigned_to)
        )
        # push para o novo técnico
        await self._push(
            assigned_to,
            {"type": "assignment", "ticket_id": ticket.id, "assigned_to": assigned_to},
        )
        if assigned_to != user.id:
            await self._notificar(
                assigned_to, ticket, "assignment",
                f"Chamado #{ticket.id} atribuido a voce",
            )
        return ticket