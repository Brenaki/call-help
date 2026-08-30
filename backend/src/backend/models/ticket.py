"""Model Ticket - tabela de chamados."""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    equipment_id: Mapped[int | None] = mapped_column(
        ForeignKey("equipments.id"), nullable=True
    )
    user_name: Mapped[str] = mapped_column(String(100), nullable=False)
    equipment_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sector: Mapped[str | None] = mapped_column(String(50), nullable=True)
    localization: Mapped[str | None] = mapped_column(String(100), nullable=True)
    problem_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(
        Enum("baixa", "media", "alta", name="priority"), default="media"
    )
    status: Mapped[str] = mapped_column(
        Enum("aberto", "em_andamento", "resolvido", name="ticket_status"),
        default="aberto",
    )
    technical_lead: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )