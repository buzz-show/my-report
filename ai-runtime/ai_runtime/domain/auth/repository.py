from __future__ import annotations

from typing import Protocol

from ai_runtime.domain.auth.entities import RefreshSession, User


class AuthRepository(Protocol):
    def init_db(self) -> None: ...

    def find_user_by_email(self, email: str) -> User | None: ...

    def create_user_and_session(self, user: User, session: RefreshSession) -> User: ...

    def record_login_and_session(
        self,
        user_id: str,
        timestamp: str,
        session: RefreshSession,
    ) -> User: ...

    def find_session_by_access_hash(
        self,
        token_hash: str,
    ) -> tuple[User, RefreshSession] | None: ...

    def find_session_by_refresh_hash(
        self,
        token_hash: str,
    ) -> tuple[User, RefreshSession] | None: ...

    def rotate_session_tokens(
        self,
        session_id: str,
        access_hash: str,
        refresh_hash: str,
        access_expires: str,
        refresh_expires: str,
        last_used: str,
    ) -> None: ...

    def revoke_by_access_hash(self, token_hash: str, revoked_at: str) -> None: ...

    def revoke_by_refresh_hash(self, token_hash: str, revoked_at: str) -> None: ...


__all__ = ['AuthRepository']
