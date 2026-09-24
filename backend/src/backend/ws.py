"""ConnectionManager do WebSocket - conexões ativas por usuário."""

from fastapi import WebSocket


class ConnectionManager:
    """Gerencia conexões WS ativas. Interface pronta para trocar por
    Redis pub/sub quando houver múltiplos workers."""

    def __init__(self):
        self._connections: dict[int, WebSocket] = {}

    def connect(self, user_id: int, websocket: WebSocket) -> None:
        self._connections[user_id] = websocket

    def disconnect(self, user_id: int) -> None:
        self._connections.pop(user_id, None)

    def is_connected(self, user_id: int) -> bool:
        return user_id in self._connections

    async def send_to_user(self, user_id: int, data: dict) -> bool:
        """Envia mensagem se o usuário estiver conectado. Retorna True se enviou."""
        websocket = self._connections.get(user_id)
        if websocket is None:
            return False
        try:
            await websocket.send_json(data)
            return True
        except Exception:
            self.disconnect(user_id)
            return False

    async def broadcast(self, data: dict) -> None:
        for user_id in list(self._connections.keys()):
            await self.send_to_user(user_id, data)


# instância única do processo
manager = ConnectionManager()