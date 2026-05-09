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


def test_login_and_me_round_trip(client: TestClient) -> None:
    response = client.post('/auth/login', json={'email': 'user@example.com', 'password': 'secret'})

    assert response.status_code == 200
    payload = response.json()
    assert payload['user']['email'] == 'user@example.com'
    assert payload['user']['logged_in'] is True

    me_response = client.get('/auth/me', headers={'Authorization': f"Bearer {payload['access_token']}"})

    assert me_response.status_code == 200
    assert me_response.json()['email'] == 'user@example.com'


def test_refresh_rotates_tokens(client: TestClient) -> None:
    login_response = client.post('/auth/login', json={'email': 'user@example.com', 'password': 'secret'})
    original = login_response.json()

    refresh_response = client.post('/auth/refresh', json={'refresh_token': original['refresh_token']})

    assert refresh_response.status_code == 200
    refreshed = refresh_response.json()
    assert refreshed['access_token'] != original['access_token']
    assert refreshed['refresh_token'] != original['refresh_token']


def test_logout_revokes_session(client: TestClient) -> None:
    login_response = client.post('/auth/login', json={'email': 'user@example.com', 'password': 'secret'})
    payload = login_response.json()

    logout_response = client.post(
        '/auth/logout',
        json={'refresh_token': payload['refresh_token']},
        headers={'Authorization': f"Bearer {payload['access_token']}"},
    )

    assert logout_response.status_code == 200
    assert logout_response.json() == {'logged_out': True}

    me_response = client.get('/auth/me', headers={'Authorization': f"Bearer {payload['access_token']}"})
    assert me_response.status_code == 401


def test_invalid_password_is_rejected(client: TestClient) -> None:
    first_login = client.post('/auth/login', json={'email': 'user@example.com', 'password': 'secret'})
    assert first_login.status_code == 200

    second_login = client.post('/auth/login', json={'email': 'user@example.com', 'password': 'wrong'})

    assert second_login.status_code == 401
    assert second_login.json()['detail'] == '密码错误'