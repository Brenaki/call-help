"""App FastAPI principal — inclui os routers dos controllers."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.controllers.auth import router as auth_router
from backend.controllers.equipments import router as equipments_router
from backend.controllers.tickets import router as tickets_router
from backend.controllers.users import router as users_router

app = FastAPI(title="Call Help - Sistema de Chamados de TI")

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
app.include_router(tickets_router)


@app.get("/")
async def root():
    return {"sistema": "call-help", "status": "ok"}