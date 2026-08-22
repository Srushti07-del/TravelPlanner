import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status, Request
from jose import JWTError, jwt
from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    user_id: str


async def get_current_user(request: Request) -> AuthenticatedUser:
    """Verify Supabase JWT from Authorization header and return the user.

    Raises 401 if the token is missing, expired, or invalid.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = auth_header.split(" ", 1)[1]
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "")
    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identifier",
        )

    return AuthenticatedUser(user_id=user_id)
