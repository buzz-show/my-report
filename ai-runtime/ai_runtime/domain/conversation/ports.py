from __future__ import annotations

from typing import Any, AsyncIterator, Protocol


class ConversationRuntime(Protocol):
    async def stream_events(
        self,
        *,
        messages: list[dict[str, str]],
        thread_id: str,
    ) -> AsyncIterator[dict[str, Any]]: ...

    async def get_state(self, *, thread_id: str) -> dict[str, Any]: ...

    async def clear_state(self, *, thread_id: str) -> None: ...


__all__ = ['ConversationRuntime']
