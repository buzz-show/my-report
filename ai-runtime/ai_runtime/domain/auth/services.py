from __future__ import annotations

import hashlib
import secrets
from hmac import compare_digest

PBKDF2_ITERATIONS = 390000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        PBKDF2_ITERATIONS,
    )
    return f'pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${derived.hex()}'


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, digest = stored_hash.split('$', 3)
    except ValueError:
        return False

    if algorithm != 'pbkdf2_sha256':
        return False

    derived = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        int(iterations),
    )
    return compare_digest(derived.hex(), digest)


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


__all__ = ['PBKDF2_ITERATIONS', 'generate_token', 'hash_password', 'hash_token', 'verify_password']
