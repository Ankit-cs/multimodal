# backend/auth.py — JWT creation/verification + bcrypt password helpers
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, Request, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from src.services.config import settings

# We use bcrypt as the hashing algorithm — passlib makes swapping schemes easy later
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password helpers ─────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Turn a plain-text password into a bcrypt hash safe to store in the DB."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if what the user typed matches the stored hash."""
    return _pwd_context.verify(plain_password, hashed_password)


# ── JWT helpers ──────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Sign a JWT containing `data`.  The token expires after `expires_delta`
    (defaults to the value set in config).
    """
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload["exp"] = expire
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Verify the token signature and expiry.
    Returns the payload dict on success, or None if anything is wrong.
    """
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


# ── FastAPI dependency ────────────────────────────────────────────────────────

async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency — reads the Bearer token from the Authorization header,
    decodes it, and returns the user payload.  Raises 401 if the token is
    missing, malformed, or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise credentials_exception

    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)

    if payload is None or "sub" not in payload:
        raise credentials_exception

    return payload  # { "sub": email, "name": ..., "id": ..., "exp": ... }
