"""
Entry point for PyInstaller-compiled executable.

Usage:
  ./ai-runtime                  # listens on PORT env var, falls back to 18765
  ./ai-runtime --port 19000     # explicit port (takes precedence over env var)

The Electron main process passes the port via the PORT environment variable
so it can use a dynamically allocated free port.
"""
from __future__ import annotations

import argparse
import os

import uvicorn

from ai_runtime.server import app


def main() -> None:
    parser = argparse.ArgumentParser(description='AI Runtime Server')
    parser.add_argument(
        '--port',
        type=int,
        default=int(os.environ.get('AI_RUNTIME_PORT', '18765')),
        help='Port to listen on (default: AI_RUNTIME_PORT env var, or 18765)',
    )
    args = parser.parse_args()

    uvicorn.run(app, host='127.0.0.1', port=args.port, log_level='warning')


if __name__ == '__main__':
    main()
