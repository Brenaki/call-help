"""Configuração do pytest: fixtures de banco e cliente async."""

import asyncio
import os
import tempfile
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.database import Base, get_db
from backend.main import app
from backend.services.storage import set_storage

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

os.environ.setdefault("SKIP_SEED", "1")

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSession = async_sessionmaker(test_engine, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db(tmp_path):
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(autouse=True)
def storage_tmp():
    """Storage isolado por teste."""
    diretorio = tempfile.mkdtemp(prefix="uploads_test_")
    from backend.services.storage import LocalStorageProvider

    set_storage(LocalStorageProvider(diretorio))
    yield diretorio
    for nome in os.listdir(diretorio):
        os.remove(os.path.join(diretorio, nome))
    os.rmdir(diretorio)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSession() as session:
        yield session