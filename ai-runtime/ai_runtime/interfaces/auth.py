from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from ai_runtime.application.auth import AuthService, AuthTokensData, SessionUserData
from ai_runtime.domain.auth.errors import AuthError
from ai_runtime.infrastructure.auth import SqliteAuthRepository

router = APIRouter(prefix='/auth', tags=['auth'])


def get_auth_service() -> AuthService:
    return AuthService(repository=SqliteAuthRepository())


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=256)


class SessionUserView(BaseModel):
    user_id: str
    email: str
    display_name: str
    role: str
    logged_in: bool = True

    @classmethod
    def from_data(cls, value: SessionUserData) -> 'SessionUserView':
        return cls(
            user_id=value.user_id,
            email=value.email,
            display_name=value.display_name,
            role=value.role,
            logged_in=value.logged_in,
        )


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: str
    user: SessionUserView

    @classmethod
    def from_data(cls, value: AuthTokensData) -> 'AuthTokens':
        return cls(
            access_token=value.access_token,
            refresh_token=value.refresh_token,
            expires_at=value.expires_at,
            user=SessionUserView.from_data(value.user),
        )


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


def as_http_exception(exc: AuthError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


def require_current_user(
    authorization: Annotated[str | None, Header()] = None,
    service: AuthService = Depends(get_auth_service),
) -> SessionUserView:
    try:
        return SessionUserView.from_data(service.get_current_user(authorization))
    except AuthError as exc:
        raise as_http_exception(exc) from exc


@router.post('/login')
async def auth_login(
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    try:
        tokens = AuthTokens.from_data(service.login(payload.email, payload.password))
        return tokens.model_dump()
    except AuthError as exc:
        raise as_http_exception(exc) from exc


@router.get('/me')
async def auth_me(current_user: SessionUserView = Depends(require_current_user)) -> dict:
    return current_user.model_dump()


@router.post('/refresh')
async def auth_refresh(
    payload: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    try:
        tokens = AuthTokens.from_data(service.refresh(payload.refresh_token))
        return tokens.model_dump()
    except AuthError as exc:
        raise as_http_exception(exc) from exc


@router.post('/logout')
async def auth_logout(
    payload: LogoutRequest,
    authorization: Annotated[str | None, Header()] = None,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    service.logout(authorization, payload.refresh_token)
    return {'logged_out': True}


__all__ = [
    'AuthService',
    'AuthTokens',
    'LoginRequest',
    'LogoutRequest',
    'RefreshRequest',
    'SessionUserView',
    'as_http_exception',
    'get_auth_service',
    'require_current_user',
    'router',
]