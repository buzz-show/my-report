from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=256)


class SessionUserView(BaseModel):
    user_id: str
    email: str
    display_name: str
    role: str
    logged_in: bool = True


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: str
    user: SessionUserView


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class LogoutRequest(BaseModel):
    refresh_token: str | None = None