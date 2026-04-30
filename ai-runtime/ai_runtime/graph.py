"""
LangGraph ReAct agent graph.

Mirrors the tools available in electron-app:
  - get_current_time
  - calculate
  - get_system_info  (note: running inside Python, values differ from the Node.js host)

State: MessagesState (built-in LangGraph type — a list of LangChain messages with
automatic last-write-wins reducer for the 'messages' key).
"""

from __future__ import annotations

import os
import platform
import re
from datetime import datetime, timezone
from typing import Any

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode


# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------


@tool
def get_current_time() -> str:
    """Return the current UTC time in ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat()


@tool
def calculate(expression: str) -> str:
    """Evaluate a safe arithmetic expression (numbers and + - * / ( ) . only).

    Args:
        expression: A math expression string, e.g. "(3+5)*2"
    """
    if not re.fullmatch(r"[\d+\-*/().\s]+", expression):
        return "错误：表达式包含不允许的字符，只支持数字和 + - * / ( ) ."
    try:
        result = eval(expression, {"__builtins__": {}})  # noqa: S307 — guarded by regex
        return str(result)
    except Exception as exc:  # noqa: BLE001
        return f"错误：表达式求值失败 — {exc}"


@tool
def get_system_info() -> str:
    """Return basic system information: OS, CPU, memory."""
    import psutil  # optional; gracefully degrade if not installed

    try:
        mem = psutil.virtual_memory()
        total_mb = round(mem.total / 1024 / 1024)
        free_mb = round(mem.available / 1024 / 1024)
    except ImportError:
        total_mb = free_mb = -1

    import json

    return json.dumps(
        {
            "platform": platform.system(),
            "arch": platform.machine(),
            "release": platform.release(),
            "processor": platform.processor() or "unknown",
            "totalMemMB": total_mb,
            "freeMemMB": free_mb,
            "hostname": platform.node(),
        },
        ensure_ascii=False,
        indent=2,
    )


TOOLS = [get_current_time, calculate, get_system_info]


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------


def build_graph() -> Any:
    """Build and compile the ReAct StateGraph with an in-memory checkpointer."""

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    base_url = os.environ.get("OPENAI_API_BASE_URL") or None
    model_name = os.environ.get("AI_MODEL", "gpt-4o")

    llm = ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url=base_url,
        streaming=True,
    ).bind_tools(TOOLS)

    tool_node = ToolNode(TOOLS)

    def should_continue(state: MessagesState) -> str:
        """Route to tool_node if the last message has tool calls, else END."""
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    async def call_model(state: MessagesState) -> dict:
        response = await llm.ainvoke(state["messages"])
        return {"messages": [response]}

    graph = StateGraph(MessagesState)
    graph.add_node("agent", call_model)
    graph.add_node("tools", tool_node)

    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    checkpointer = MemorySaver()
    return graph.compile(checkpointer=checkpointer)
