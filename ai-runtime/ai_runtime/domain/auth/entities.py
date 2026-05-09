from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class User:
    id: str
    email: str
    display_name: str
    password_hash: str
    role: str
    created_at: str
    updated_at: str
    last_login_at: str | None


@dataclass(frozen=True, slots=True)
class RefreshSession:
    id: str
    user_id: str
    access_token_hash: str
    refresh_token_hash: str
    access_expires_at: str
    refresh_expires_at: str
    revoked_at: str | None
    created_at: str
    last_used_at: str


__all__ = ['RefreshSession', 'User']
