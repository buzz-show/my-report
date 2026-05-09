from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from ai_runtime.domain.auth.entities import RefreshSession, User
from ai_runtime.domain.auth.errors import AuthError
from ai_runtime.domain.auth.repository import AuthRepository
from ai_runtime.domain.auth.services import generate_token, hash_password, hash_token, verify_password
from ai_runtime.infrastructure.config import get_settings


@dataclass(frozen=True, slots=True)
class SessionUserData:
    user_id: str
    email: str
    display_name: str
    role: str
    logged_in: bool = True


@dataclass(frozen=True, slots=True)
class AuthTokensData:
    access_token: str
    refresh_token: str
    expires_at: str
    user: SessionUserData


class AuthService:
    def __init__(self, repository: AuthRepository) -> None:
        self._repository = repository

    def init_db(self) -> None:
        self._repository.init_db()

    def login(self, email: str, password: str) -> AuthTokensData:
        normalized_email = _normalize_email(email)
        existing_user = self._repository.find_user_by_email(normalized_email)

        if existing_user is None:
            new_user = _build_new_user(normalized_email, password)
            session, raw_access, raw_refresh = _build_session(new_user.id)
            self._repository.create_user_and_session(new_user, session)
            return _make_tokens(new_user, session, raw_access, raw_refresh)

        if not verify_password(password, existing_user.password_hash):
            raise AuthError('密码错误', status_code=401)

        timestamp = _to_iso(_utc_now())
        session, raw_access, raw_refresh = _build_session(existing_user.id)
        updated_user = self._repository.record_login_and_session(existing_user.id, timestamp, session)
        return _make_tokens(updated_user, session, raw_access, raw_refresh)

    def get_current_user(self, authorization: str | None) -> SessionUserData:
        access_token = _get_bearer_token(authorization)
        pair = self._repository.find_session_by_access_hash(hash_token(access_token))
        if pair is None:
            raise AuthError('会话不存在或已失效', status_code=401)

        user, session = pair
        now = _utc_now()
        if session.revoked_at is not None:
            raise AuthError('会话已注销', status_code=401)
        if _parse_iso(session.access_expires_at) <= now:
            raise AuthError('访问令牌已过期', status_code=401)
        if _parse_iso(session.refresh_expires_at) <= now:
            raise AuthError('刷新令牌已过期', status_code=401)

        return _build_user_view(user)

    def refresh(self, refresh_token: str) -> AuthTokensData:
        pair = self._repository.find_session_by_refresh_hash(hash_token(refresh_token))
        if pair is None:
            raise AuthError('刷新令牌无效', status_code=401)

        user, session = pair
        now = _utc_now()
        if session.revoked_at is not None or _parse_iso(session.refresh_expires_at) <= now:
            raise AuthError('刷新令牌已失效', status_code=401)

        new_access_token = generate_token()
        new_refresh_token = generate_token()
        settings = get_settings().auth
        access_expires_at = now + timedelta(minutes=settings.access_ttl_minutes)
        refresh_expires_at = now + timedelta(days=settings.refresh_ttl_days)
        last_used = _to_iso(now)

        self._repository.rotate_session_tokens(
            session_id=session.id,
            access_hash=hash_token(new_access_token),
            refresh_hash=hash_token(new_refresh_token),
            access_expires=_to_iso(access_expires_at),
            refresh_expires=_to_iso(refresh_expires_at),
            last_used=last_used,
        )

        return AuthTokensData(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_at=_to_iso(access_expires_at),
            user=_build_user_view(user),
        )

    def logout(self, authorization: str | None, refresh_token: str | None) -> None:
        access_token: str | None = None
        if authorization:
            try:
                access_token = _get_bearer_token(authorization)
            except AuthError:
                access_token = None

        if not access_token and not refresh_token:
            return

        revoked_at = _to_iso(_utc_now())
        if access_token:
            self._repository.revoke_by_access_hash(hash_token(access_token), revoked_at)
        if refresh_token:
            self._repository.revoke_by_refresh_hash(hash_token(refresh_token), revoked_at)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_iso(value: datetime) -> str:
    return value.isoformat()


def _parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _get_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith('Bearer '):
        raise AuthError('缺少认证信息', status_code=401)
    token = authorization[len('Bearer '):]
    if not token:
        raise AuthError('无效的认证令牌', status_code=401)
    return token


def _build_new_user(email: str, password: str) -> User:
    now = _to_iso(_utc_now())
    return User(
        id=f'user-{uuid4().hex}',
        email=email,
        display_name=email.split('@', 1)[0],
        password_hash=hash_password(password),
        role='member',
        created_at=now,
        updated_at=now,
        last_login_at=now,
    )


def _build_session(user_id: str) -> tuple[RefreshSession, str, str]:
    now = _utc_now()
    settings = get_settings().auth
    raw_access = generate_token()
    raw_refresh = generate_token()
    access_expires_at = now + timedelta(minutes=settings.access_ttl_minutes)
    refresh_expires_at = now + timedelta(days=settings.refresh_ttl_days)
    timestamp = _to_iso(now)
    session = RefreshSession(
        id=f'session-{uuid4().hex}',
        user_id=user_id,
        access_token_hash=hash_token(raw_access),
        refresh_token_hash=hash_token(raw_refresh),
        access_expires_at=_to_iso(access_expires_at),
        refresh_expires_at=_to_iso(refresh_expires_at),
        revoked_at=None,
        created_at=timestamp,
        last_used_at=timestamp,
    )
    return session, raw_access, raw_refresh


def _make_tokens(user: User, session: RefreshSession, raw_access: str, raw_refresh: str) -> AuthTokensData:
    return AuthTokensData(
        access_token=raw_access,
        refresh_token=raw_refresh,
        expires_at=session.access_expires_at,
        user=_build_user_view(user),
    )


def _build_user_view(user: User) -> SessionUserData:
    return SessionUserData(
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
    )


__all__ = ['AuthError', 'AuthService', 'AuthTokensData', 'SessionUserData']
