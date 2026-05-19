from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ai_runtime.application.task import CreateTaskPayload, TaskService
from ai_runtime.infrastructure.task import SqliteTaskRepository
from ai_runtime.interfaces.auth import SessionUserView, require_current_user

router = APIRouter(prefix='/tasks', tags=['tasks'])


def get_task_service() -> TaskService:
    return TaskService(repository=SqliteTaskRepository())


class CreateTaskRequest(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = ''
    priority: str = 'medium'
    badge: str = ''
    time: str = '待定'
    tags: list[str] = []


class TaskView(BaseModel):
    id: str
    title: str
    description: str
    priority: str
    badge: str
    time: str
    tags: list[str]
    done_at: str | None
    created_at: str


@router.post('', response_model=TaskView, status_code=201)
def create_task(
    body: CreateTaskRequest,
    current_user: SessionUserView = Depends(require_current_user),
    service: TaskService = Depends(get_task_service),
) -> TaskView:
    try:
        task = service.create_task(
            user_id=current_user.user_id,
            payload=CreateTaskPayload(
                title=body.title,
                description=body.description,
                priority=body.priority,
                badge=body.badge,
                time=body.time,
                tags=body.tags,
            ),
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return TaskView(
        id=task.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        badge=task.badge,
        time=task.time,
        tags=task.tags,
        done_at=task.done_at,
        created_at=task.created_at,
    )
