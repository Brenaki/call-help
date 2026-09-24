"""App FastAPI principal — inclui os routers dos controllers."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.controllers.attachments import router as attachments_router
from backend.controllers.auth import router as auth_router
from backend.controllers.conversa import router as conversa_router
from backend.controllers.equipments import router as equipments_router
from backend.controllers.notifications import router as notifications_router
from backend.controllers.rooms import router as rooms_router
from backend.controllers.tickets import router as tickets_router
from backend.controllers.users import router as users_router
from backend.controllers.ws import router as ws_router
from backend.database import async_session
from backend.services.seed import seed_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # seed de admin no startup (pulado em testes)
    import os

    if os.environ.get("SKIP_SEED") != "1":
        async with async_session() as db:
            await seed_admin(db)
    yield


app = FastAPI(
    title="Call Help - Sistema de Chamados de TI",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(equipments_router)
app.include_router(rooms_router)
app.include_router(tickets_router)
app.include_router(conversa_router)
app.include_router(attachments_router)
app.include_router(notifications_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    return {"sistema": "call-help", "status": "ok"}
