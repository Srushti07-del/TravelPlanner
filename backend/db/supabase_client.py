import os
from supabase import create_client, Client
from typing import Dict, List, Optional


def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    return create_client(url, key)


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
