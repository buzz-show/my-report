from __future__ import annotations

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_runtime.infrastructure.auth import SqliteAuthRepository
from ai_runtime.infrastructure.task import SqliteTaskRepository
from ai_runtime.interfaces.auth import router as auth_router
from ai_runtime.interfaces.chat import router as chat_router
from ai_runtime.interfaces.health import router as health_router
from ai_runtime.interfaces.task import router as task_router

load_dotenv()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    SqliteAuthRepository().init_db()
    SqliteTaskRepository().init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title='AI Runtime', version='0.1.0', lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_methods=['*'],
        allow_headers=['*'],
    )
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(chat_router)
    app.include_router(task_router)
    return app


app = create_app()
