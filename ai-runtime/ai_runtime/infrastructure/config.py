from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


@dataclass(frozen=True, slots=True)
class AuthSettings:
    access_ttl_minutes: int
    refresh_ttl_days: int
    db_path: Path


@dataclass(frozen=True, slots=True)
class AISettings:
    model: str
    api_key: str | None
    base_url: str | None


@dataclass(frozen=True, slots=True)
class RuntimeSettings:
    auth: AuthSettings
    ai: AISettings


def _runtime_root() -> Path:
    return Path(__file__).resolve().parents[1]


@lru_cache(maxsize=1)
def get_settings() -> RuntimeSettings:
    configured_db_path = os.environ.get('AI_RUNTIME_AUTH_DB_PATH')
    auth_db_path = (
        Path(configured_db_path).expanduser().resolve()
        if configured_db_path
        else _runtime_root() / '.data' / 'auth.db'
    )

    return RuntimeSettings(
        auth=AuthSettings(
            access_ttl_minutes=int(os.environ.get('AUTH_ACCESS_TTL_MINUTES', '30')),
            refresh_ttl_days=int(os.environ.get('AUTH_REFRESH_TTL_DAYS', '7')),
            db_path=auth_db_path,
        ),
        ai=AISettings(
            model=os.environ.get('AI_MODEL', 'gpt-4o'),
            api_key=os.environ.get('OPENAI_API_KEY'),
            base_url=os.environ.get('OPENAI_API_BASE_URL') or None,
        ),
    )


def reset_settings_cache() -> None:
    get_settings.cache_clear()