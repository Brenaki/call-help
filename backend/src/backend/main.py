"""App FastAPI principal — inclui os routers dos controllers."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.controllers.auth import router as auth_router

app = FastAPI(title="Call Help - Sistema de Chamados de TI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/")
async def root():
    return {"sistema": "call-help", "status": "ok"}