from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from pathlib import Path

from ai_runtime.domain.task.entities import Task
from ai_runtime.infrastructure.config import get_settings


def _runtime_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _default_db_path() -> Path:
    configured = get_settings().auth.db_path.parent
    return configured / 'tasks.db'


def _row_to_task(row: sqlite3.Row) -> Task:
    return Task(
        id=row['id'],
        user_id=row['user_id'],
        title=row['title'],
        description=row['description'],
        priority=row['priority'],
        badge=row['badge'],
        time=row['time'],
        tags=json.loads(row['tags']),
        done_at=row['done_at'],
        created_at=row['created_at'],
    )


class SqliteTaskRepository:
    def __init__(self, db_path: Path | None = None) -> None:
        self._db_path = db_path or _default_db_path()

    def _connect(self) -> sqlite3.Connection:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self._db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def init_db(self) -> None:
        with closing(self._connect()) as connection:
            connection.executescript(
                '''
                CREATE TABLE IF NOT EXISTS tasks (
                    id          TEXT PRIMARY KEY,
                    user_id     TEXT NOT NULL,
                    title       TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    priority    TEXT NOT NULL DEFAULT 'medium',
                    badge       TEXT NOT NULL DEFAULT '',
                    time        TEXT NOT NULL DEFAULT '待定',
                    tags        TEXT NOT NULL DEFAULT '[]',
                    done_at     TEXT,
                    created_at  TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
                '''
            )
            connection.commit()

    def create(self, task: Task) -> Task:
        with closing(self._connect()) as connection:
            connection.execute(
                '''
                INSERT INTO tasks
                    (id, user_id, title, description, priority, badge, time, tags, done_at, created_at)
                VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    task.id,
                    task.user_id,
                    task.title,
                    task.description,
                    task.priority,
                    task.badge,
                    task.time,
                    json.dumps(task.tags, ensure_ascii=False),
                    task.done_at,
                    task.created_at,
                ),
            )
            connection.commit()
        return task
