import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from db.supabase_client import (
    create_expense,
    get_expense,
    list_trip_expenses,
    update_expense,
    delete_expense,
    get_expense_summary,
)


_SAMPLE = {
    "trip_id": "trip-1",
    "user_id": "u1",
    "category": "food",
    "amount": 250.0,
    "description": "Lunch",
    "expense_date": "2026-01-01",
}


def _make_mock():
    mock = MagicMock()
    mock.table.return_value = mock
    return mock


@pytest.mark.asyncio
async def test_create_expense():
    mock = _make_mock()
    mock.insert.return_value.execute.return_value.data = [{"id": "exp-1", **_SAMPLE}]
    with patch("db.supabase_client.get_supabase", return_value=mock):
        saved = await create_expense(_SAMPLE)
    assert saved["amount"] == 250.0


@pytest.mark.asyncio
async def test_get_expense():
    mock = _make_mock()
    mock.select.return_value.eq.return_value.execute.return_value.data = [{"id": "exp-1", **_SAMPLE}]
    with patch("db.supabase_client.get_supabase", return_value=mock):
        fetched = await get_expense("exp-1")
    assert fetched["id"] == "exp-1"


@pytest.mark.asyncio
async def test_list_trip_expenses():
    mock = _make_mock()
    mock.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
        {"id": "exp-1", **_SAMPLE}
    ]
    with patch("db.supabase_client.get_supabase", return_value=mock):
        rows = await list_trip_expenses("trip-1")
    assert len(rows) == 1
    assert rows[0]["amount"] == 250.0


@pytest.mark.asyncio
async def test_update_expense():
    mock = _make_mock()
    mock.update.return_value.eq.return_value.execute.return_value.data = [
        {"id": "exp-1", **_SAMPLE, "amount": 300.0}
    ]
    with patch("db.supabase_client.get_supabase", return_value=mock):
        updated = await update_expense("exp-1", {"amount": 300.0})
    assert updated["amount"] == 300.0


@pytest.mark.asyncio
async def test_delete_expense():
    mock = _make_mock()
    mock.delete.return_value.eq.return_value.execute.return_value.data = [{"id": "exp-1"}]
    with patch("db.supabase_client.get_supabase", return_value=mock):
        ok = await delete_expense("exp-1")
    assert ok is True


@pytest.mark.asyncio
async def test_expense_summary():
    mock = _make_mock()
    mock.select.return_value.eq.return_value.execute.return_value.data = [
        {"category": "food", "amount": 100.0},
        {"category": "transport", "amount": 50.0},
    ]
    with patch("db.supabase_client.get_supabase", return_value=mock):
        summary = await get_expense_summary("trip-1")
    assert summary["total_spent"] == 150.0
    assert summary["by_category"]["food"] == 100.0
    assert summary["by_category"]["transport"] == 50.0
