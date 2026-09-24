"""Endpoint WebSocket /ws - tempo real sem polling."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.security import decodificar_jwt
from backend.ws import manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    payload = decodificar_jwt(token) if token else None
    if payload is None or payload.get("sub") is None:
        # 4401 = auth expirada/inválida (frontend redireciona ao login)
        await websocket.close(code=4401)
        return

    user_id = int(payload["sub"])
    await websocket.accept()
    manager.connect(user_id, websocket)

    try:
        await websocket.send_json({"type": "connected", "user_id": user_id})
        # mantém a conexão viva; mensagens do cliente são ignoradas
        while True:
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)