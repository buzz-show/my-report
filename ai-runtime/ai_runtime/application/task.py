from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from ai_runtime.domain.task.entities import Task
from ai_runtime.domain.task.repository import TaskRepository


@dataclass(frozen=True, slots=True)
class CreateTaskPayload:
    title: str
    description: str = ''
    priority: str = 'medium'
    badge: str = ''
    time: str = '待定'
    tags: list[str] = field(default_factory=list)


class TaskService:
    def __init__(self, repository: TaskRepository) -> None:
        self._repository = repository

    def init_db(self) -> None:
        self._repository.init_db()

    def create_task(self, user_id: str, payload: CreateTaskPayload) -> Task:
        title = payload.title.strip()
        if not title:
            raise ValueError('任务标题不能为空')

        task = Task(
            id=str(uuid4()),
            user_id=user_id,
            title=title,
            description=payload.description.strip(),
            priority=payload.priority,
            badge=payload.badge,
            time=payload.time.strip() or '待定',
            tags=list(payload.tags),
            done_at=None,
            created_at=datetime.now(tz=timezone.utc).isoformat(),
        )
        return self._repository.create(task)
