from __future__ import annotations

import json
import platform
import re
from datetime import datetime, timezone
from typing import Any, AsyncIterator

from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode

from ai_runtime.domain.conversation.ports import ConversationRuntime
from ai_runtime.infrastructure.config import get_settings


@tool
def get_current_time() -> str:
    """Return the current UTC time in ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat()


@tool
def calculate(expression: str) -> str:
    """Evaluate a safe arithmetic expression using numbers and + - * / ( ) . only."""
    if not re.fullmatch(r"[\d+\-*/().\s]+", expression):
        return '错误：表达式包含不允许的字符，只支持数字和 + - * / ( ) .'
    try:
        result = eval(expression, {'__builtins__': {}})  # noqa: S307
        return str(result)
    except Exception as exc:  # noqa: BLE001
        return f'错误：表达式求值失败 — {exc}'


@tool
def get_system_info() -> str:
    """Return basic system information such as OS, CPU, and memory."""
    try:
        import psutil

        mem = psutil.virtual_memory()
        total_mb = round(mem.total / 1024 / 1024)
        free_mb = round(mem.available / 1024 / 1024)
    except ImportError:
        total_mb = free_mb = -1

    return json.dumps(
        {
            'platform': platform.system(),
            'arch': platform.machine(),
            'release': platform.release(),
            'processor': platform.processor() or 'unknown',
            'totalMemMB': total_mb,
            'freeMemMB': free_mb,
            'hostname': platform.node(),
        },
        ensure_ascii=False,
        indent=2,
    )


TOOLS = [get_current_time, calculate, get_system_info]


def build_graph() -> Any:
    settings = get_settings().ai
    if not settings.api_key:
        raise RuntimeError('OPENAI_API_KEY is not set')

    llm = ChatOpenAI(
        model=settings.model,
        api_key=settings.api_key,
        base_url=settings.base_url,
        streaming=True,
    ).bind_tools(TOOLS)

    tool_node = ToolNode(TOOLS)

    def should_continue(state: MessagesState) -> str:
        last = state['messages'][-1]
        if hasattr(last, 'tool_calls') and last.tool_calls:
            return 'tools'
        return END

    async def call_model(state: MessagesState) -> dict:
        response = await llm.ainvoke(state['messages'])
        return {'messages': [response]}

    graph = StateGraph(MessagesState)
    graph.add_node('agent', call_model)
    graph.add_node('tools', tool_node)

    graph.add_edge(START, 'agent')
    graph.add_conditional_edges('agent', should_continue, {'tools': 'tools', END: END})
    graph.add_edge('tools', 'agent')

    return graph.compile(checkpointer=MemorySaver())


class LangGraphConversationRuntime:
    def __init__(self):
        self._graph: Any | None = None

    def _get_graph(self) -> Any:
        if self._graph is None:
            self._graph = build_graph()
        return self._graph

    async def stream_events(
        self,
        *,
        messages: list[dict[str, str]],
        thread_id: str,
    ) -> AsyncIterator[dict[str, Any]]:
        config = {'configurable': {'thread_id': thread_id}}
        async for event in self._get_graph().astream_events(
            {'messages': messages},
            config=config,
            version='v2',
        ):
            yield event

    async def get_state(self, *, thread_id: str) -> dict[str, Any]:
        config = {'configurable': {'thread_id': thread_id}}
        state = await self._get_graph().aget_state(config)
        return state.values

    async def clear_state(self, *, thread_id: str) -> None:
        config = {'configurable': {'thread_id': thread_id}}
        await self._get_graph().aupdate_state(config, {'messages': []})


__all__ = [
    'LangGraphConversationRuntime',
    'TOOLS',
    'build_graph',
    'calculate',
    'get_current_time',
    'get_system_info',
]