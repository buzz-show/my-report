from __future__ import annotations

import json
from typing import Annotated, AsyncIterator

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

from .auth import (
    AuthError,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    SessionUserView,
    get_current_user,
    init_auth_db,
    login_user,
    logout_session,
    refresh_session,
)
from .graph import build_graph  # noqa: E402

app = FastAPI(title="AI Runtime", version="0.1.0")

# Allow calls from Electron renderer (file:// origin) during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_graph = None


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    thread_id: str = "default"


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


def as_http_exception(exc: AuthError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


def require_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> SessionUserView:
    try:
        return get_current_user(authorization)
    except AuthError as exc:
        raise as_http_exception(exc) from exc


@app.on_event('startup')
async def startup() -> None:
    init_auth_db()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post('/auth/login')
async def auth_login(payload: LoginRequest) -> dict:
    try:
        tokens = login_user(payload.email, payload.password)
        return tokens.model_dump()
    except AuthError as exc:
        raise as_http_exception(exc) from exc


@app.get('/auth/me')
async def auth_me(current_user: SessionUserView = Depends(require_current_user)) -> dict:
    return current_user.model_dump()


@app.post('/auth/refresh')
async def auth_refresh(payload: RefreshRequest) -> dict:
    try:
        tokens = refresh_session(payload.refresh_token)
        return tokens.model_dump()
    except AuthError as exc:
        raise as_http_exception(exc) from exc


@app.post('/auth/logout')
async def auth_logout(
    payload: LogoutRequest,
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    logout_session(authorization, payload.refresh_token)
    return {'logged_out': True}


@app.post("/chat/stream")
async def chat_stream(
    req: ChatRequest,
    _current_user: SessionUserView = Depends(require_current_user),
) -> StreamingResponse:
    """Stream LangGraph events back to the caller as Server-Sent Events."""

    input_messages = [{"role": m.role, "content": m.content} for m in req.messages]
    config = {"configurable": {"thread_id": req.thread_id}}
    graph = get_graph()

    async def event_generator() -> AsyncIterator[str]:
        try:
            async for event in graph.astream_events(
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
async def get_thread_state(
    thread_id: str,
    _current_user: SessionUserView = Depends(require_current_user),
) -> dict:
    """Return the current persisted state for a thread."""
    config = {"configurable": {"thread_id": thread_id}}
    try:
        state = await get_graph().aget_state(config)
        return {"thread_id": thread_id, "values": state.values}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.delete("/chat/{thread_id}/state")
async def clear_thread_state(
    thread_id: str,
    _current_user: SessionUserView = Depends(require_current_user),
) -> dict:
    """Clear persisted state (start a fresh conversation for the thread)."""
    # LangGraph MemorySaver doesn't expose a delete API; we update with empty messages.
    config = {"configurable": {"thread_id": thread_id}}
    try:
        await get_graph().aupdate_state(config, {"messages": []})
        return {"thread_id": thread_id, "cleared": True}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
