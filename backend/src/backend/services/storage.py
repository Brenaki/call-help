"""Storage abstraído - provider local com interface pronta para S3."""

import os
import uuid
from typing import BinaryIO, Protocol, runtime_checkable

from backend.config import settings


class StorageError(Exception):
    """Erro de armazenamento."""


@runtime_checkable
class StorageProvider(Protocol):
    def save(self, stored_name: str, data: BinaryIO) -> None: ...
    def open(self, stored_name: str) -> BinaryIO: ...
    def delete(self, stored_name: str) -> None: ...
    def exists(self, stored_name: str) -> bool: ...


class LocalStorageProvider:
    """Salva arquivos no disco local (pasta configurável)."""

    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        os.makedirs(base_dir, exist_ok=True)

    def _caminho(self, stored_name: str) -> str:
        # impede path traversal
        if "/" in stored_name or ".." in stored_name:
            raise StorageError("Nome de arquivo invalido")
        return os.path.join(self.base_dir, stored_name)

    def save(self, stored_name: str, data: BinaryIO) -> None:
        with open(self._caminho(stored_name), "wb") as f:
            f.write(data.read())

    def open(self, stored_name: str) -> BinaryIO:
        return open(self._caminho(stored_name), "rb")

    def delete(self, stored_name: str) -> None:
        caminho = self._caminho(stored_name)
        if os.path.exists(caminho):
            os.remove(caminho)

    def exists(self, stored_name: str) -> bool:
        return os.path.exists(self._caminho(stored_name))


def novo_stored_name(file_name: str) -> str:
    """Gera nome único preservando a extensão original."""
    ext = os.path.splitext(file_name)[1].lower()
    return f"{uuid.uuid4().hex}{ext}"


_provider: StorageProvider | None = None


def get_storage() -> StorageProvider:
    """Factory: retorna o provider configurado (local hoje, S3 no futuro)."""
    global _provider
    if _provider is None:
        _provider = LocalStorageProvider(settings.upload_dir)
    return _provider


def set_storage(provider: StorageProvider) -> None:
    """Injeta provider alternativo (testes / S3 futuro)."""
    global _provider
    _provider = provider