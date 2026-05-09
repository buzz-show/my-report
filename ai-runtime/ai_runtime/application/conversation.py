from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any, AsyncIterator

from ai_runtime.domain.conversation.ports import ConversationRuntime
from ai_runtime.infrastructure.ai_orchestration import LangGraphConversationRuntime


@dataclass(frozen=True, slots=True)
class ConversationMessage:
    role: str
    content: str


class ConversationService:
    def __init__(self, runtime: ConversationRuntime):
        self._runtime = runtime

    async def stream_events(
        self,
        *,
        messages: list[ConversationMessage],
        thread_id: str,
    ) -> AsyncIterator[dict[str, Any]]:
        input_messages = [{'role': message.role, 'content': message.content} for message in messages]
        async for event in self._runtime.stream_events(messages=input_messages, thread_id=thread_id):
            yield event

    async def get_thread_state(self, *, thread_id: str) -> dict[str, Any]:
        values = await self._runtime.get_state(thread_id=thread_id)
        return {'thread_id': thread_id, 'values': values}

    async def clear_thread_state(self, *, thread_id: str) -> dict[str, Any]:
        await self._runtime.clear_state(thread_id=thread_id)
        return {'thread_id': thread_id, 'cleared': True}


@lru_cache(maxsize=1)
def get_conversation_service() -> ConversationService:
    return ConversationService(runtime=LangGraphConversationRuntime())


def reset_conversation_service_cache() -> None:
    get_conversation_service.cache_clear()


__all__ = [
    'ConversationMessage',
    'ConversationRuntime',
    'ConversationService',
    'get_conversation_service',
    'reset_conversation_service_cache',
]