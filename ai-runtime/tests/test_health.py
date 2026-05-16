"""
test_health — /health 端点集成测试
复用 test_auth_api.py 的 client fixture 模式（tmp_path + monkeypatch）。
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("AI_RUNTIME_AUTH_DB_PATH", str(tmp_path / "auth.db"))

    from ai_runtime.infrastructure.config import reset_settings_cache

    reset_settings_cache()

    from ai_runtime.server import create_app

    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_is_idempotent(client: TestClient) -> None:
    r1 = client.get("/health")
    r2 = client.get("/health")

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json() == r2.json()
