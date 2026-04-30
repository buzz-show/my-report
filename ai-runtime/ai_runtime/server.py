from __future__ import annotations

import json
import os
from typing import AsyncIterator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

from .graph import build_graph  # noqa: E402

app = FastAPI(title="AI Runtime", version="0.1.0")

# Allow calls from Electron renderer (file:// origin) during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_graph = build_graph()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    thread_id: str = "default"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest) -> StreamingResponse:
    """Stream LangGraph events back to the caller as Server-Sent Events."""

    input_messages = [{"role": m.role, "content": m.content} for m in req.messages]
    config = {"configurable": {"thread_id": req.thread_id}}

    async def event_generator() -> AsyncIterator[str]:
        try:
            async for event in _graph.astream_events(
                {"messages": input_messages},
                config=config,
                version="v2",
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/chat/{thread_id}/state")
async def get_thread_state(thread_id: str) -> dict:
    """Return the current persisted state for a thread."""
    config = {"configurable": {"thread_id": thread_id}}
    try:
        state = await _graph.aget_state(config)
        return {"thread_id": thread_id, "values": state.values}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.delete("/chat/{thread_id}/state")
async def clear_thread_state(thread_id: str) -> dict:
    """Clear persisted state (start a fresh conversation for the thread)."""
    # LangGraph MemorySaver doesn't expose a delete API; we update with empty messages.
    config = {"configurable": {"thread_id": thread_id}}
    try:
        await _graph.aupdate_state(config, {"messages": []})
        return {"thread_id": thread_id, "cleared": True}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
