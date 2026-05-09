from __future__ import annotations

import sqlite3
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path

from ai_runtime.domain.auth.entities import RefreshSession, User
from ai_runtime.infrastructure.config import get_settings


@dataclass(slots=True)
class _UserRow:
    id: str
    email: str
    display_name: str
    password_hash: str
    role: str
    created_at: str
    updated_at: str
    last_login_at: str | None


@dataclass(slots=True)
class _SessionRow:
    id: str
    user_id: str
    access_token_hash: str
    refresh_token_hash: str
    access_expires_at: str
    refresh_expires_at: str
    revoked_at: str | None
    created_at: str
    last_used_at: str


def _row_to_user(row: sqlite3.Row) -> User:
    return User(
        id=row['id'],
        email=row['email'],
        display_name=row['display_name'],
        password_hash=row['password_hash'],
        role=row['role'],
        created_at=row['created_at'],
        updated_at=row['updated_at'],
        last_login_at=row['last_login_at'],
    )


def _row_to_session(row: sqlite3.Row) -> RefreshSession:
    return RefreshSession(
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


class SqliteAuthRepository:
    def __init__(self, db_path: Path | None = None):
        self._db_path = db_path or get_settings().auth.db_path

    # ------------------------------------------------------------------
    # Internal connection factory
    # ------------------------------------------------------------------

    def _connect(self) -> sqlite3.Connection:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self._db_path)
        connection.row_factory = sqlite3.Row
        return connection

    # ------------------------------------------------------------------
    # AuthRepository Protocol implementation
    # ------------------------------------------------------------------

    def init_db(self) -> None:
        with closing(self._connect()) as connection:
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

    def find_user_by_email(self, email: str) -> User | None:
        with closing(self._connect()) as connection:
            row = connection.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
            return _row_to_user(row) if row else None

    def create_user_and_session(self, user: User, session: RefreshSession) -> User:
        with closing(self._connect()) as connection:
            connection.execute(
                '''
                INSERT INTO users (id, email, display_name, password_hash, role, created_at, updated_at, last_login_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (user.id, user.email, user.display_name, user.password_hash, user.role,
                 user.created_at, user.updated_at, user.last_login_at),
            )
            self._insert_session(connection, session)
            connection.commit()
        return user

    def record_login_and_session(self, user_id: str, timestamp: str, session: RefreshSession) -> User:
        with closing(self._connect()) as connection:
            connection.execute(
                'UPDATE users SET updated_at = ?, last_login_at = ? WHERE id = ?',
                (timestamp, timestamp, user_id),
            )
            self._insert_session(connection, session)
            connection.commit()
            row = connection.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        if row is None:
            raise RuntimeError(f'User {user_id!r} not found after login update')
        return _row_to_user(row)

    def find_session_by_access_hash(self, token_hash: str) -> tuple[User, RefreshSession] | None:
        return self._find_session_by(access_token_hash=token_hash)

    def find_session_by_refresh_hash(self, token_hash: str) -> tuple[User, RefreshSession] | None:
        return self._find_session_by(refresh_token_hash=token_hash)

    def rotate_session_tokens(
        self,
        session_id: str,
        access_hash: str,
        refresh_hash: str,
        access_expires: str,
        refresh_expires: str,
        last_used: str,
    ) -> None:
        with closing(self._connect()) as connection:
            connection.execute(
                '''
                UPDATE refresh_sessions
                SET access_token_hash = ?, refresh_token_hash = ?, access_expires_at = ?,
                    refresh_expires_at = ?, last_used_at = ?
                WHERE id = ?
                ''',
                (access_hash, refresh_hash, access_expires, refresh_expires, last_used, session_id),
            )
            connection.commit()

    def revoke_by_access_hash(self, token_hash: str, revoked_at: str) -> None:
        with closing(self._connect()) as connection:
            connection.execute(
                'UPDATE refresh_sessions SET revoked_at = ? WHERE access_token_hash = ?',
                (revoked_at, token_hash),
            )
            connection.commit()

    def revoke_by_refresh_hash(self, token_hash: str, revoked_at: str) -> None:
        with closing(self._connect()) as connection:
            connection.execute(
                'UPDATE refresh_sessions SET revoked_at = ? WHERE refresh_token_hash = ?',
                (revoked_at, token_hash),
            )
            connection.commit()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _insert_session(self, connection: sqlite3.Connection, session: RefreshSession) -> None:
        connection.execute(
            '''
            INSERT INTO refresh_sessions (
                id, user_id, access_token_hash, refresh_token_hash, access_expires_at,
                refresh_expires_at, revoked_at, created_at, last_used_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                session.id,
                session.user_id,
                session.access_token_hash,
                session.refresh_token_hash,
                session.access_expires_at,
                session.refresh_expires_at,
                session.revoked_at,
                session.created_at,
                session.last_used_at,
            ),
        )

    def _find_session_by(
        self,
        *,
        access_token_hash: str | None = None,
        refresh_token_hash: str | None = None,
    ) -> tuple[User, RefreshSession] | None:
        if access_token_hash is not None:
            where_clause = 'WHERE refresh_sessions.access_token_hash = ?'
            param = access_token_hash
        else:
            where_clause = 'WHERE refresh_sessions.refresh_token_hash = ?'
            param = refresh_token_hash

        with closing(self._connect()) as connection:
            row = connection.execute(
                f'''
                SELECT users.*,
                       refresh_sessions.id AS session_id,
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
                {where_clause}
                ''',
                (param,),
            ).fetchone()
        if not row:
            return None
        return _row_to_user(row), _row_to_session(row)


__all__ = ['SqliteAuthRepository']