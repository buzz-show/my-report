from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv('AI_RUNTIME_AUTH_DB_PATH', str(tmp_path / 'auth.db'))

    from ai_runtime.infrastructure.config import reset_settings_cache

    reset_settings_cache()

    from ai_runtime.server import create_app

    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient, email: str = 'user@example.com', password: str = 'secret') -> str:
    """登录并返回 access_token。"""
    response = client.post('/auth/login', json={'email': email, 'password': password})
    assert response.status_code == 200
    return response.json()['access_token']


def _auth(token: str) -> dict[str, str]:
    return {'Authorization': f'Bearer {token}'}


# ---------------------------------------------------------------------------
# 401 — 未鉴权
# ---------------------------------------------------------------------------


def test_create_task_requires_auth(client: TestClient) -> None:
    response = client.post('/tasks', json={'title': '买菜'})

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 201 — 正常创建
# ---------------------------------------------------------------------------


def test_create_task_returns_201_with_all_fields(client: TestClient) -> None:
    token = _login(client)

    response = client.post(
        '/tasks',
        json={
            'title': '写周报',
            'description': '本周工作总结',
            'priority': 'high',
            'badge': '工作',
            'time': '18:00',
            'tags': ['work', 'weekly'],
        },
        headers=_auth(token),
    )

    assert response.status_code == 201
    body = response.json()
    assert body['title'] == '写周报'
    assert body['description'] == '本周工作总结'
    assert body['priority'] == 'high'
    assert body['badge'] == '工作'
    assert body['time'] == '18:00'
    assert body['tags'] == ['work', 'weekly']
    assert body['done_at'] is None
    assert 'id' in body
    assert 'created_at' in body


def test_create_task_applies_defaults(client: TestClient) -> None:
    """仅传 title，其余字段应为默认值。"""
    token = _login(client)

    response = client.post('/tasks', json={'title': '买菜'}, headers=_auth(token))

    assert response.status_code == 201
    body = response.json()
    assert body['title'] == '买菜'
    assert body['description'] == ''
    assert body['priority'] == 'medium'
    assert body['badge'] == ''
    assert body['time'] == '待定'
    assert body['tags'] == []
    assert body['done_at'] is None


def test_create_task_strips_whitespace_from_title(client: TestClient) -> None:
    token = _login(client)

    response = client.post('/tasks', json={'title': '  买菜  '}, headers=_auth(token))

    assert response.status_code == 201
    assert response.json()['title'] == '买菜'


def test_create_task_each_has_unique_id(client: TestClient) -> None:
    token = _login(client)

    r1 = client.post('/tasks', json={'title': '任务 A'}, headers=_auth(token))
    r2 = client.post('/tasks', json={'title': '任务 B'}, headers=_auth(token))

    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r1.json()['id'] != r2.json()['id']


# ---------------------------------------------------------------------------
# 422 — 请求校验失败
# ---------------------------------------------------------------------------


def test_create_task_rejects_empty_title(client: TestClient) -> None:
    token = _login(client)

    response = client.post('/tasks', json={'title': ''}, headers=_auth(token))

    assert response.status_code == 422


def test_create_task_rejects_whitespace_only_title(client: TestClient) -> None:
    """空白标题经 service 层校验后应返回 422。"""
    token = _login(client)

    response = client.post('/tasks', json={'title': '   '}, headers=_auth(token))

    assert response.status_code == 422


def test_create_task_rejects_title_over_500_chars(client: TestClient) -> None:
    token = _login(client)

    response = client.post('/tasks', json={'title': 'x' * 501}, headers=_auth(token))

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# 用户隔离 — 不同用户创建的任务独立
# ---------------------------------------------------------------------------


def test_create_task_id_is_isolated_per_user(client: TestClient) -> None:
    """两个用户各自创建任务，返回的 id 各不相同，互不干扰。"""
    token_a = _login(client, email='alice@example.com')
    token_b = _login(client, email='bob@example.com')

    ra = client.post('/tasks', json={'title': 'Alice 的任务'}, headers=_auth(token_a))
    rb = client.post('/tasks', json={'title': 'Bob 的任务'}, headers=_auth(token_b))

    assert ra.status_code == 201
    assert rb.status_code == 201
    assert ra.json()['id'] != rb.json()['id']
