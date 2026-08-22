import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, Mock
import httpx
from fastapi import HTTPException
from auth import get_current_user


class MockCredentials:
    def __init__(self, credentials: str):
        self.credentials = credentials


def _make_mock_response(json_data, status_code=200):
    mock_response = Mock()
    mock_response.status_code = status_code
    mock_response.json.return_value = json_data
    return mock_response


@pytest.mark.asyncio
async def test_get_current_user_valid_token():
    mock_user = {"id": "user-123", "email": "test@example.com"}
    with patch("auth.httpx.AsyncClient") as MockClient:
        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = _make_mock_response(mock_user)
        MockClient.return_value.__aenter__.return_value = mock_client_instance

        with patch.dict("os.environ", {
            "SUPABASE_URL": "https://test.supabase.co",
            "SUPABASE_ANON_KEY": "anon-key",
        }):
            user_id = await get_current_user(MockCredentials("valid-token"))
            assert user_id == "user-123"


@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    with patch("auth.httpx.AsyncClient") as MockClient:
        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = _make_mock_response({}, status_code=401)
        MockClient.return_value.__aenter__.return_value = mock_client_instance

        with patch.dict("os.environ", {
            "SUPABASE_URL": "https://test.supabase.co",
            "SUPABASE_ANON_KEY": "anon-key",
        }):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(MockCredentials("invalid-token"))
            assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_missing_config():
    with patch.dict("os.environ", {}, clear=True):
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(MockCredentials("token"))
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_get_current_user_network_error():
    with patch("auth.httpx.AsyncClient") as MockClient:
        mock_client_instance = AsyncMock()
        mock_client_instance.get.side_effect = httpx.RequestError("Network error")
        MockClient.return_value.__aenter__.return_value = mock_client_instance

        with patch.dict("os.environ", {
            "SUPABASE_URL": "https://test.supabase.co",
            "SUPABASE_ANON_KEY": "anon-key",
        }):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(MockCredentials("token"))
            assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_missing_id_in_payload():
    with patch("auth.httpx.AsyncClient") as MockClient:
        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = _make_mock_response({"email": "test@example.com"})
        MockClient.return_value.__aenter__.return_value = mock_client_instance

        with patch.dict("os.environ", {
            "SUPABASE_URL": "https://test.supabase.co",
            "SUPABASE_ANON_KEY": "anon-key",
        }):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(MockCredentials("token"))
            assert exc_info.value.status_code == 401
