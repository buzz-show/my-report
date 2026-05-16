"""
test_application_auth — application/auth.AuthService 集成测试
使用真实 SQLite（tmp_path）+ SqliteAuthRepository，不 mock IO。
验证：
  - login 自动注册新用户
  - 相同密码可二次登录
  - 错误密码引发 AuthError
  - get_current_user 用有效 access_token 返回用户信息
  - get_current_user 用无效 token 引发 AuthError
  - refresh 轮换令牌
  - logout 撤销会话
"""
from __future__ import annotations

from pathlib import Path

import pytest

from ai_runtime.application.auth import AuthService
from ai_runtime.domain.auth.errors import AuthError
from ai_runtime.infrastructure.auth import SqliteAuthRepository


@pytest.fixture
def service(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> AuthService:
    db_path = tmp_path / "test-auth.db"
    monkeypatch.setenv("AI_RUNTIME_AUTH_DB_PATH", str(db_path))

    from ai_runtime.infrastructure.config import reset_settings_cache

    reset_settings_cache()

    repo = SqliteAuthRepository(db_path=db_path)
    svc = AuthService(repo)
    svc.init_db()
    return svc


# ── login ─────────────────────────────────────────────────────────────────────


def test_login_creates_new_user_on_first_call(service: AuthService) -> None:
    tokens = service.login("new@example.com", "password123")

    assert tokens.access_token
    assert tokens.refresh_token
    assert tokens.user.email == "new@example.com"


def test_login_normalises_email_to_lowercase(service: AuthService) -> None:
    tokens = service.login("Alice@Example.COM", "pass")

    assert tokens.user.email == "alice@example.com"


def test_login_succeeds_on_second_call_with_correct_password(service: AuthService) -> None:
    service.login("user@example.com", "mypassword")
    tokens2 = service.login("user@example.com", "mypassword")

    assert tokens2.access_token


def test_login_raises_on_wrong_password(service: AuthService) -> None:
    service.login("user@example.com", "correct-pass")

    with pytest.raises(AuthError) as exc_info:
        service.login("user@example.com", "wrong-pass")

    assert exc_info.value.status_code == 401


# ── get_current_user ──────────────────────────────────────────────────────────


def test_get_current_user_returns_session_data_with_valid_token(service: AuthService) -> None:
    tokens = service.login("user@example.com", "pass")
    auth_header = f"Bearer {tokens.access_token}"

    user_data = service.get_current_user(auth_header)

    assert user_data.email == "user@example.com"
    assert user_data.logged_in is True


def test_get_current_user_raises_with_invalid_token(service: AuthService) -> None:
    with pytest.raises(AuthError) as exc_info:
        service.get_current_user("Bearer invalid-token-xyz")

    assert exc_info.value.status_code == 401


def test_get_current_user_raises_without_authorization_header(service: AuthService) -> None:
    with pytest.raises(AuthError):
        service.get_current_user(None)


# ── refresh ───────────────────────────────────────────────────────────────────


def test_refresh_returns_new_tokens(service: AuthService) -> None:
    tokens = service.login("user@example.com", "pass")

    new_tokens = service.refresh(tokens.refresh_token)

    assert new_tokens.access_token != tokens.access_token
    assert new_tokens.refresh_token != tokens.refresh_token


def test_refresh_new_access_token_is_valid(service: AuthService) -> None:
    tokens = service.login("user@example.com", "pass")
    new_tokens = service.refresh(tokens.refresh_token)

    user_data = service.get_current_user(f"Bearer {new_tokens.access_token}")

    assert user_data.email == "user@example.com"


def test_refresh_raises_with_invalid_token(service: AuthService) -> None:
    with pytest.raises(AuthError) as exc_info:
        service.refresh("not-a-real-refresh-token")

    assert exc_info.value.status_code == 401


# ── logout ────────────────────────────────────────────────────────────────────


def test_logout_revokes_session(service: AuthService) -> None:
    tokens = service.login("user@example.com", "pass")
    auth_header = f"Bearer {tokens.access_token}"

    service.logout(auth_header, tokens.refresh_token)

    with pytest.raises(AuthError):
        service.get_current_user(auth_header)


def test_logout_without_tokens_does_not_raise(service: AuthService) -> None:
    # Should be a no-op
    service.logout(None, None)
