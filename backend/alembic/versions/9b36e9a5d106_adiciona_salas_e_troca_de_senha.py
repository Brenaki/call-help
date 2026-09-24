"""adiciona salas e troca obrigatoria de senha

Revision ID: 9b36e9a5d106
Revises: 12c283bfa408
Create Date: 2026-09-24
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "9b36e9a5d106"
down_revision: Union[str, Sequence[str], None] = "12c283bfa408"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("must_change_password", sa.Boolean(), server_default=sa.text("0"), nullable=False),
    )
    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("localization", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "room_equipments",
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("equipment_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("room_id", "equipment_id"),
    )


def downgrade() -> None:
    op.drop_table("room_equipments")
    op.drop_table("rooms")
    op.drop_column("users", "must_change_password")
