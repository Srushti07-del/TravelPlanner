import os
from supabase import create_client, Client
from typing import Dict, List, Optional

_client: Optional[Client] = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_KEY", "")
        _client = create_client(url, key)
    return _client

async def save_trip(trip_data: Dict) -> Dict:
    supabase = get_supabase()
    response = supabase.table("trips").insert(trip_data).execute()
    return response.data[0] if response.data else {}


async def get_trip(trip_id: str) -> Optional[Dict]:
    supabase = get_supabase()
    response = supabase.table("trips").select("*").eq("id", trip_id).execute()
    return response.data[0] if response.data else None


async def get_trip_for_user(trip_id: str, user_id: str) -> Optional[Dict]:
    supabase = get_supabase()
    response = (
        supabase.table("trips")
        .select("*")
        .eq("id", trip_id)
        .eq("user_id", user_id)
        .execute()
    )
    return response.data[0] if response.data else None


async def update_trip(trip_id: str, updates: Dict) -> Dict:
    supabase = get_supabase()
    response = supabase.table("trips").update(updates).eq("id", trip_id).execute()
    return response.data[0] if response.data else {}


async def delete_trip(trip_id: str) -> bool:
    supabase = get_supabase()
    response = supabase.table("trips").delete().eq("id", trip_id).execute()
    return len(response.data) > 0


async def list_user_trips(user_id: str) -> List[Dict]:
    supabase = get_supabase()
    response = supabase.table("trips").select("id, title, destination, start_date, end_date, num_travelers, total_budget, currency, created_at").eq("user_id", user_id).execute()
    return response.data


async def save_trip_change(change_data: Dict) -> Dict:
    supabase = get_supabase()
    response = supabase.table("trip_changes").insert(change_data).execute()
    return response.data[0] if response.data else {}

async def create_expense(expense_data: Dict) -> Dict:
    supabase = get_supabase()
    response = supabase.table("expenses").insert(expense_data).execute()
    return response.data[0] if response.data else {}

async def get_expense(expense_id: str) -> Optional[Dict]:
    supabase = get_supabase()
    response = supabase.table("expenses").select("*").eq("id", expense_id).execute()
    return response.data[0] if response.data else None

async def list_trip_expenses(trip_id: str) -> List[Dict]:
    supabase = get_supabase()
    response = supabase.table("expenses").select("*").eq("trip_id", trip_id).order("expense_date", desc=False).execute()
    return response.data

async def update_expense(expense_id: str, updates: Dict) -> Dict:
    supabase = get_supabase()
    response = supabase.table("expenses").update(updates).eq("id", expense_id).execute()
    return response.data[0] if response.data else {}

async def delete_expense(expense_id: str) -> bool:
    supabase = get_supabase()
    response = supabase.table("expenses").delete().eq("id", expense_id).execute()
    return len(response.data) > 0

async def get_expense_summary(trip_id: str) -> Dict:
    supabase = get_supabase()
    response = supabase.table("expenses").select("category, amount").eq("trip_id", trip_id).execute()
    rows = response.data or []
    total = sum(float(r.get("amount", 0) or 0) for r in rows)
    by_category: Dict[str, float] = {}
    for r in rows:
        cat = r.get("category") or "other"
        by_category[cat] = by_category.get(cat, 0.0) + float(r.get("amount", 0) or 0)
    return {"total_spent": round(total, 2), "by_category": {k: round(v, 2) for k, v in by_category.items()}}
