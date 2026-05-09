from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient


class FakeState:
    def __init__(self, values: dict):
        self.values = values


class FakeGraph:
    def __init__(self):
        self.state = {'messages': [{'role': 'assistant', 'content': 'hello'}]}
        self.last_stream_payload = None
        self.last_stream_config = None
        self.last_update = None

    async def astream_events(self, payload: dict, config: dict, version: str):
        self.last_stream_payload = payload
        self.last_stream_config = config
        yield {
            'event': 'on_chat_model_stream',
            'data': {'chunk': {'content': 'hello'}},
        }
        yield {
            'event': 'on_tool_start',
            'name': 'calculate',
            'run_id': 'tool-1',
            'data': {'input': {'expression': '1+1'}},
        }

    async def aget_state(self, config: dict):
        return FakeState({'messages': self.state['messages'], 'config': config})

    async def aupdate_state(self, config: dict, values: dict):
        self.last_update = {'config': config, 'values': values}
        self.state = values


class FakeRuntime:
    def __init__(self):
        self.graph = FakeGraph()

    async def stream_events(self, *, messages, thread_id: str):
        async for event in self.graph.astream_events(
            {'messages': messages},
            {'configurable': {'thread_id': thread_id}},
            'v2',
        ):
            yield event

    async def get_state(self, *, thread_id: str):
        state = await self.graph.aget_state({'configurable': {'thread_id': thread_id}})
        return state.values

    async def clear_state(self, *, thread_id: str):
        await self.graph.aupdate_state({'configurable': {'thread_id': thread_id}}, {'messages': []})


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv('AI_RUNTIME_AUTH_DB_PATH', str(tmp_path / 'auth.db'))

    from ai_runtime.infrastructure.config import reset_settings_cache

    reset_settings_cache()

    from ai_runtime.application.conversation import ConversationService
    from ai_runtime.interfaces import chat as chat_router_module
    from ai_runtime.server import create_app

    fake_runtime = FakeRuntime()
    fake_service = ConversationService(runtime=fake_runtime)
    monkeypatch.setattr(chat_router_module, 'get_conversation_service', lambda: fake_service)

    app = create_app()
    with TestClient(app) as test_client:
        test_client.fake_service = fake_service  # type: ignore[attr-defined]
        test_client.fake_runtime = fake_runtime  # type: ignore[attr-defined]
        yield test_client


def _login(client: TestClient) -> dict:
    response = client.post('/auth/login', json={'email': 'user@example.com', 'password': 'secret'})
    assert response.status_code == 200
    return response.json()


def test_chat_stream_requires_auth(client: TestClient) -> None:
    response = client.post('/chat/stream', json={'messages': [{'role': 'user', 'content': 'hi'}]})

    assert response.status_code == 401


def test_chat_stream_returns_sse_events_and_done_marker(client: TestClient) -> None:
    session = _login(client)

    with client.stream(
        'POST',
        '/chat/stream',
        json={'messages': [{'role': 'user', 'content': 'hi'}], 'thread_id': 'thread-1'},
        headers={'Authorization': f"Bearer {session['access_token']}"},
    ) as response:
        body = ''.join(response.iter_text())

    assert response.status_code == 200
    assert response.headers['content-type'].startswith('text/event-stream')
    assert 'data: {"event": "on_chat_model_stream"' in body
    assert 'data: {"event": "on_tool_start"' in body
    assert 'data: [DONE]' in body
    assert client.fake_runtime.graph.last_stream_payload == {'messages': [{'role': 'user', 'content': 'hi'}]}  # type: ignore[attr-defined]
    assert client.fake_runtime.graph.last_stream_config == {'configurable': {'thread_id': 'thread-1'}}  # type: ignore[attr-defined]


def test_get_thread_state_returns_graph_state(client: TestClient) -> None:
    session = _login(client)

    response = client.get(
        '/chat/thread-42/state',
        headers={'Authorization': f"Bearer {session['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json() == {
        'thread_id': 'thread-42',
        'values': {
            'messages': [{'role': 'assistant', 'content': 'hello'}],
            'config': {'configurable': {'thread_id': 'thread-42'}},
        },
    }


def test_clear_thread_state_updates_graph(client: TestClient) -> None:
    session = _login(client)

    response = client.delete(
        '/chat/thread-99/state',
        headers={'Authorization': f"Bearer {session['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json() == {'thread_id': 'thread-99', 'cleared': True}
    assert client.fake_runtime.graph.last_update == {  # type: ignore[attr-defined]
        'config': {'configurable': {'thread_id': 'thread-99'}},
        'values': {'messages': []},
    }