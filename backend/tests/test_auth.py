import os
import pytest
from jose import jwt
from fastapi import HTTPException
from services.auth import get_current_user
from starlette.requests import Request


_SECRET = "test-secret"
_ALG = "HS256"


def _make_request(token: str) -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "headers": [(b"authorization", f"Bearer {token}".encode())],
        "query_string": b"",
        "path": "/",
    }
    return Request(scope)


@pytest.mark.asyncio
async def test_get_current_user_valid_token(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", _SECRET)
    payload = {"sub": "user-123", "exp": 9999999999}
    token = jwt.encode(payload, _SECRET, algorithm=_ALG)
    req = _make_request(token)
    user = await get_current_user(req)
    assert user.user_id == "user-123"


@pytest.mark.asyncio
async def test_get_current_user_missing_header(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", _SECRET)
    scope = {
        "type": "http",
        "method": "GET",
        "headers": [],
        "query_string": b"",
        "path": "/",
    }
    req = Request(scope)
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(req)
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", _SECRET)
    req = _make_request("not-a-real-token")
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(req)
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_missing_sub(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", _SECRET)
    payload = {"exp": 9999999999}
    token = jwt.encode(payload, _SECRET, algorithm=_ALG)
    req = _make_request(token)
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(req)
    assert exc_info.value.status_code == 401
