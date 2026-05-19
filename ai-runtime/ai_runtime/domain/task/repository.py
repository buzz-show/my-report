from __future__ import annotations

from typing import Protocol

from ai_runtime.domain.task.entities import Task


class TaskRepository(Protocol):
    def init_db(self) -> None: ...

    def create(self, task: Task) -> Task: ...


__all__ = ['TaskRepository']
