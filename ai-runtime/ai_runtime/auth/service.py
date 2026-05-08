from __future__ import annotations

import os
import sqlite3
from contextlib import closing
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from .models import RefreshSessionRecord, UserRecord
from .schemas import AuthTokens, SessionUserView
from .security import generate_token, hash_password, hash_token, verify_password

ACCESS_TTL_MINUTES = int(os.environ.get('AUTH_ACCESS_TTL_MINUTES', '30'))
REFRESH_TTL_DAYS = int(os.environ.get('AUTH_REFRESH_TTL_DAYS', '7'))


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_db_path() -> Path:
    configured = os.environ.get('AI_RUNTIME_AUTH_DB_PATH')
    if configured:
        return Path(configured).expanduser().resolve()
    root = Path(__file__).resolve().parents[2]
    return root / '.data' / 'auth.db'


def get_connection() -> sqlite3.Connection:
    path = get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def init_auth_db() -> None:
    with closing(get_connection()) as connection:
        connection.executescript(
            '''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_login_at TEXT
            );

            CREATE TABLE IF NOT EXISTS refresh_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                access_token_hash TEXT NOT NULL UNIQUE,
                refresh_token_hash TEXT NOT NULL UNIQUE,
                access_expires_at TEXT NOT NULL,
                refresh_expires_at TEXT NOT NULL,
                revoked_at TEXT,
                created_at TEXT NOT NULL,
                last_used_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            '''
        )
        connection.commit()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(value: datetime) -> str:
    return value.isoformat()


def parse_iso(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value)


def row_to_user(row: sqlite3.Row) -> UserRecord:
    return UserRecord(
        id=row['id'],
        email=row['email'],
        display_name=row['display_name'],
        password_hash=row['password_hash'],
        role=row['role'],
        created_at=row['created_at'],
        updated_at=row['updated_at'],
        last_login_at=row['last_login_at'],
    )


def row_to_session(row: sqlite3.Row) -> RefreshSessionRecord:
    return RefreshSessionRecord(
        id=row['id'],
        user_id=row['user_id'],
        access_token_hash=row['access_token_hash'],
        refresh_token_hash=row['refresh_token_hash'],
        access_expires_at=row['access_expires_at'],
        refresh_expires_at=row['refresh_expires_at'],
        revoked_at=row['revoked_at'],
        created_at=row['created_at'],
        last_used_at=row['last_used_at'],
    )


def build_user_view(user: UserRecord) -> SessionUserView:
    return SessionUserView(
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        logged_in=True,
    )


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(connection: sqlite3.Connection, email: str) -> UserRecord | None:
    row = connection.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    return row_to_user(row) if row else None


def get_session_by_access_token(
    connection: sqlite3.Connection,
    access_token: str,
) -> tuple[UserRecord, RefreshSessionRecord] | None:
    row = connection.execute(
        '''
        SELECT users.*, refresh_sessions.id AS session_id,
               refresh_sessions.user_id AS session_user_id,
               refresh_sessions.access_token_hash,
               refresh_sessions.refresh_token_hash,
               refresh_sessions.access_expires_at,
               refresh_sessions.refresh_expires_at,
               refresh_sessions.revoked_at,
               refresh_sessions.created_at AS session_created_at,
               refresh_sessions.last_used_at
        FROM refresh_sessions
        JOIN users ON users.id = refresh_sessions.user_id
        WHERE refresh_sessions.access_token_hash = ?
        ''',
        (hash_token(access_token),),
    ).fetchone()
    if not row:
        return None

    session = RefreshSessionRecord(
        id=row['session_id'],
        user_id=row['session_user_id'],
        access_token_hash=row['access_token_hash'],
        refresh_token_hash=row['refresh_token_hash'],
        access_expires_at=row['access_expires_at'],
        refresh_expires_at=row['refresh_expires_at'],
        revoked_at=row['revoked_at'],
        created_at=row['session_created_at'],
        last_used_at=row['last_used_at'],
    )
    return row_to_user(row), session


def get_session_by_refresh_token(
    connection: sqlite3.Connection,
    refresh_token: str,
) -> tuple[UserRecord, RefreshSessionRecord] | None:
    row = connection.execute(
        '''
        SELECT users.*, refresh_sessions.id AS session_id,
               refresh_sessions.user_id AS session_user_id,
               refresh_sessions.access_token_hash,
               refresh_sessions.refresh_token_hash,
               refresh_sessions.access_expires_at,
               refresh_sessions.refresh_expires_at,
               refresh_sessions.revoked_at,
               refresh_sessions.created_at AS session_created_at,
               refresh_sessions.last_used_at
        FROM refresh_sessions
        JOIN users ON users.id = refresh_sessions.user_id
        WHERE refresh_sessions.refresh_token_hash = ?
        ''',
        (hash_token(refresh_token),),
    ).fetchone()
    if not row:
        return None

    session = RefreshSessionRecord(
        id=row['session_id'],
        user_id=row['session_user_id'],
        access_token_hash=row['access_token_hash'],
        refresh_token_hash=row['refresh_token_hash'],
        access_expires_at=row['access_expires_at'],
        refresh_expires_at=row['refresh_expires_at'],
        revoked_at=row['revoked_at'],
        created_at=row['session_created_at'],
        last_used_at=row['last_used_at'],
    )
    return row_to_user(row), session


def create_user(connection: sqlite3.Connection, email: str, password: str) -> UserRecord:
    now = to_iso(utc_now())
    user = UserRecord(
        id=f'user-{uuid4().hex}',
        email=email,
        display_name=email.split('@', 1)[0],
        password_hash=hash_password(password),
        role='member',
        created_at=now,
        updated_at=now,
        last_login_at=now,
    )
    connection.execute(
        '''
        INSERT INTO users (id, email, display_name, password_hash, role, created_at, updated_at, last_login_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            user.id,
            user.email,
            user.display_name,
            user.password_hash,
            user.role,
            user.created_at,
            user.updated_at,
            user.last_login_at,
        ),
    )
    return user


def update_last_login(connection: sqlite3.Connection, user_id: str) -> None:
    now = to_iso(utc_now())
    connection.execute(
        'UPDATE users SET updated_at = ?, last_login_at = ? WHERE id = ?',
        (now, now, user_id),
    )


def issue_session(connection: sqlite3.Connection, user: UserRecord) -> AuthTokens:
    now = utc_now()
    access_token = generate_token()
    refresh_token = generate_token()
    access_expires_at = now + timedelta(minutes=ACCESS_TTL_MINUTES)
    refresh_expires_at = now + timedelta(days=REFRESH_TTL_DAYS)
    session_id = f'session-{uuid4().hex}'
    timestamp = to_iso(now)

    connection.execute(
        '''
        INSERT INTO refresh_sessions (
            id, user_id, access_token_hash, refresh_token_hash, access_expires_at,
            refresh_expires_at, revoked_at, created_at, last_used_at
        )
        VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
        ''',
        (
            session_id,
            user.id,
            hash_token(access_token),
            hash_token(refresh_token),
            to_iso(access_expires_at),
            to_iso(refresh_expires_at),
            timestamp,
            timestamp,
        ),
    )
    return AuthTokens(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=to_iso(access_expires_at),
        user=build_user_view(user),
    )


def login_user(email: str, password: str) -> AuthTokens:
    normalized_email = normalize_email(email)
    with closing(get_connection()) as connection:
        user = get_user_by_email(connection, normalized_email)
        if user is None:
            user = create_user(connection, normalized_email, password)
        else:
            if not verify_password(password, user.password_hash):
                raise AuthError('密码错误', status_code=401)
            update_last_login(connection, user.id)
            user = get_user_by_email(connection, normalized_email)
            if user is None:
                raise AuthError('用户不存在', status_code=404)

        tokens = issue_session(connection, user)
        connection.commit()
        return tokens


def get_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise AuthError('未提供访问凭证', status_code=401)
    scheme, _, token = authorization.partition(' ')
    if scheme.lower() != 'bearer' or not token:
        raise AuthError('访问凭证格式无效', status_code=401)
    return token.strip()


def get_current_user(authorization: str | None) -> SessionUserView:
    access_token = get_bearer_token(authorization)
    with closing(get_connection()) as connection:
        session_pair = get_session_by_access_token(connection, access_token)
        if session_pair is None:
            raise AuthError('会话不存在或已失效', status_code=401)

        user, session = session_pair
        now = utc_now()
        if session.revoked_at is not None:
            raise AuthError('会话已注销', status_code=401)
        if parse_iso(session.access_expires_at) <= now:
            raise AuthError('访问令牌已过期', status_code=401)
        if parse_iso(session.refresh_expires_at) <= now:
            raise AuthError('刷新令牌已过期', status_code=401)

        return build_user_view(user)


def refresh_session(refresh_token: str) -> AuthTokens:
    with closing(get_connection()) as connection:
        session_pair = get_session_by_refresh_token(connection, refresh_token)
        if session_pair is None:
            raise AuthError('刷新令牌无效', status_code=401)

        user, session = session_pair
        now = utc_now()
        if session.revoked_at is not None or parse_iso(session.refresh_expires_at) <= now:
            raise AuthError('刷新令牌已失效', status_code=401)

        new_access_token = generate_token()
        new_refresh_token = generate_token()
        new_access_expires_at = now + timedelta(minutes=ACCESS_TTL_MINUTES)
        new_refresh_expires_at = now + timedelta(days=REFRESH_TTL_DAYS)
        connection.execute(
            '''
            UPDATE refresh_sessions
            SET access_token_hash = ?, refresh_token_hash = ?, access_expires_at = ?,
                refresh_expires_at = ?, last_used_at = ?
            WHERE id = ?
            ''',
            (
                hash_token(new_access_token),
                hash_token(new_refresh_token),
                to_iso(new_access_expires_at),
                to_iso(new_refresh_expires_at),
                to_iso(now),
                session.id,
            ),
        )
        connection.commit()
        return AuthTokens(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_at=to_iso(new_access_expires_at),
            user=build_user_view(user),
        )


def logout_session(authorization: str | None, refresh_token: str | None) -> None:
    access_token = None
    if authorization:
        try:
            access_token = get_bearer_token(authorization)
        except AuthError:
            access_token = None

    if not access_token and not refresh_token:
        return

    with closing(get_connection()) as connection:
        revoked_at = to_iso(utc_now())
        if access_token:
            connection.execute(
                'UPDATE refresh_sessions SET revoked_at = ? WHERE access_token_hash = ?',
                (revoked_at, hash_token(access_token)),
            )
        if refresh_token:
            connection.execute(
                'UPDATE refresh_sessions SET revoked_at = ? WHERE refresh_token_hash = ?',
                (revoked_at, hash_token(refresh_token)),
            )
        connection.commit()