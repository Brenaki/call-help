"""Repository de notificações."""

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_user(self, user_id: int) -> list[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.id.desc())
            .limit(50)
        )
        return list(result.scalars().all())

    async def unread_count(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        return int(result.scalar() or 0)

    async def mark_read(self, notification_id: int, user_id: int) -> bool:
        result = await self.db.execute(
            update(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
            .values(is_read=True)
        )
        await self.db.commit()
        return result.rowcount > 0

    async def mark_all_read(self, user_id: int) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True)
        )
        await self.db.commit()
        return result.rowcount

    async def create(self, notification: Notification) -> Notification:
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def create_many(self, notifications: list[Notification]) -> None:
        for n in notifications:
            self.db.add(n)
        await self.db.commit()