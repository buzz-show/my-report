"""
test_domain_auth — domain/auth 纯单元测试
覆盖：
  - domain/auth/services.py  hash_password / verify_password / generate_token / hash_token
  - domain/auth/entities.py  User / RefreshSession 数据类构造与不可变性
不依赖数据库或 FastAPI，全部内存运行。
"""
from __future__ import annotations

import pytest

from ai_runtime.domain.auth.entities import RefreshSession, User
from ai_runtime.domain.auth.services import (
    generate_token,
    hash_password,
    hash_token,
    verify_password,
)

# ── hash_password ─────────────────────────────────────────────────────────────


def test_hash_password_is_not_plaintext() -> None:
    hashed = hash_password("my-secret")
    assert hashed != "my-secret"


def test_hash_password_uses_pbkdf2_format() -> None:
    hashed = hash_password("my-secret")
    assert hashed.startswith("pbkdf2_sha256$")
    # Format: algorithm$iterations$salt$digest — 4 parts
    assert len(hashed.split("$")) == 4


def test_hash_password_different_salts_produce_different_hashes() -> None:
    h1 = hash_password("same-password")
    h2 = hash_password("same-password")
    # Different salts each call → different stored hashes
    assert h1 != h2


# ── verify_password ───────────────────────────────────────────────────────────


def test_verify_password_correct_returns_true() -> None:
    hashed = hash_password("correct-pass")
    assert verify_password("correct-pass", hashed) is True


def test_verify_password_wrong_returns_false() -> None:
    hashed = hash_password("correct-pass")
    assert verify_password("wrong-pass", hashed) is False


def test_verify_password_malformed_hash_returns_false() -> None:
    assert verify_password("any-pass", "not-a-valid-hash") is False


def test_verify_password_empty_hash_returns_false() -> None:
    assert verify_password("pass", "") is False


# ── generate_token ────────────────────────────────────────────────────────────


def test_generate_token_returns_non_empty_string() -> None:
    token = generate_token()
    assert isinstance(token, str)
    assert len(token) > 20


def test_generate_token_is_unique() -> None:
    tokens = {generate_token() for _ in range(10)}
    assert len(tokens) == 10  # all 10 should be unique


# ── hash_token ────────────────────────────────────────────────────────────────


def test_hash_token_is_deterministic() -> None:
    token = "some-token-value"
    assert hash_token(token) == hash_token(token)


def test_hash_token_is_sha256_hex() -> None:
    digest = hash_token("value")
    assert len(digest) == 64
    assert all(c in "0123456789abcdef" for c in digest)


def test_hash_token_differs_from_original() -> None:
    token = "my-token"
    assert hash_token(token) != token


# ── User entity ───────────────────────────────────────────────────────────────


def test_user_entity_constructs_correctly() -> None:
    user = User(
        id="u1",
        email="alice@example.com",
        display_name="Alice",
        password_hash="hash",
        role="user",
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        last_login_at=None,
    )
    assert user.id == "u1"
    assert user.email == "alice@example.com"
    assert user.last_login_at is None


def test_user_entity_is_immutable() -> None:
    user = User(
        id="u1",
        email="alice@example.com",
        display_name="Alice",
        password_hash="hash",
        role="user",
        created_at="2024-01-01T00:00:00Z",
        updated_at="2024-01-01T00:00:00Z",
        last_login_at=None,
    )
    with pytest.raises(Exception):  # FrozenInstanceError for frozen dataclass
        user.email = "other@example.com"  # type: ignore[misc]


# ── RefreshSession entity ─────────────────────────────────────────────────────


def test_refresh_session_entity_constructs_correctly() -> None:
    session = RefreshSession(
        id="s1",
        user_id="u1",
        access_token_hash="ath",
        refresh_token_hash="rth",
        access_expires_at="2999-01-01T00:00:00Z",
        refresh_expires_at="2999-01-01T00:00:00Z",
        revoked_at=None,
        created_at="2024-01-01T00:00:00Z",
        last_used_at="2024-01-01T00:00:00Z",
    )
    assert session.user_id == "u1"
    assert session.revoked_at is None
