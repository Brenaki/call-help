"""Controller de anexos - download com permissão."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.deps import get_current_user
from backend.models.user import User
from backend.repositories.attachment_repo import AttachmentRepository
from backend.services.storage import get_storage

router = APIRouter(tags=["anexos"])


@router.get("/anexos/{attachment_id}")
async def baixar_anexo(
    attachment_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = AttachmentRepository(db)
    anexo = await repo.get_by_id(attachment_id)
    if anexo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo nao encontrado",
        )

    # permissão: admin, uploader, ou dono do chamado
    if user.role != "admin" and anexo.uploaded_by != user.id:
        from backend.services.ticket_service import TicketService

        ticket = await TicketService(db).get_by_id(anexo.ticket_id)
        if ticket is None or ticket.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissao para baixar este anexo",
            )

    storage = get_storage()
    if not storage.exists(anexo.stored_name):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo nao encontrado no armazenamento",
        )

    file = storage.open(anexo.stored_name)

    def stream():
        yield from file

    return StreamingResponse(
        stream(),
        media_type=anexo.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{anexo.file_name}"'
        },
    )