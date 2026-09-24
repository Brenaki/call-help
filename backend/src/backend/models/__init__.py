"""Importa todos os models para o Alembic conhecer."""

from backend.models.attachment import Attachment
from backend.models.equipment import Equipment
from backend.models.notification import Notification
from backend.models.room import Room, room_equipments
from backend.models.ticket import Ticket
from backend.models.ticket_comment import TicketComment
from backend.models.ticket_event import TicketEvent
from backend.models.user import User

__all__ = [
    "Attachment",
    "Equipment",
    "Notification",
    "Room",
    "Ticket",
    "TicketComment",
    "TicketEvent",
    "User",
    "room_equipments",
]
