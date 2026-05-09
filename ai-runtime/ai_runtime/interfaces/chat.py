from __future__ import annotations

import json
from typing import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ai_runtime.application.conversation import ConversationMessage, get_conversation_service
from ai_runtime.interfaces.auth import SessionUserView, require_current_user

router = APIRouter(prefix='/chat', tags=['chat'])


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    thread_id: str = 'default'


@router.post('/stream')
async def chat_stream(
    req: ChatRequest,
    _current_user: SessionUserView = Depends(require_current_user),
) -> StreamingResponse:
    conversation_service = get_conversation_service()
    messages = [ConversationMessage(role=message.role, content=message.content) for message in req.messages]

    async def event_generator() -> AsyncIterator[str]:
        try:
            async for event in conversation_service.stream_events(messages=messages, thread_id=req.thread_id):
                yield f'data: {json.dumps(event)}\n\n'
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
        finally:
            yield 'data: [DONE]\n\n'

    return StreamingResponse(event_generator(), media_type='text/event-stream')


@router.get('/{thread_id}/state')
async def get_thread_state(
    thread_id: str,
    _current_user: SessionUserView = Depends(require_current_user),
) -> dict:
    try:
        return await get_conversation_service().get_thread_state(thread_id=thread_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete('/{thread_id}/state')
async def clear_thread_state(
    thread_id: str,
    _current_user: SessionUserView = Depends(require_current_user),
) -> dict:
    try:
        return await get_conversation_service().clear_thread_state(thread_id=thread_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


__all__ = ['ChatRequest', 'Message', 'get_conversation_service', 'router']