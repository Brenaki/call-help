"""Importa todos os models para o Alembic conhecer."""

from backend.models.user import User
from backend.models.equipment import Equipment
from backend.models.ticket import Ticket

__all__ = ["User", "Equipment", "Ticket"]