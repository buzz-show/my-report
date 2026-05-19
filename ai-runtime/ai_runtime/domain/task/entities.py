from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Task:
    id: str
    user_id: str
    title: str
    description: str
    priority: str
    badge: str
    time: str
    tags: list[str]
    done_at: str | None
    created_at: str


__all__ = ['Task']
