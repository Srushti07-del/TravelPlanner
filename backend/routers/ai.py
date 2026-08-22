from fastapi import APIRouter, HTTPException, Depends
from models.schemas import ChatRequest, ChatResponse, ReplanRequest, ReplanResponse
from services.gemini_service import GeminiService
from services.auth import get_current_user, AuthenticatedUser
from db.supabase_client import save_trip_change, get_trip

router = APIRouter(prefix="/ai", tags=["ai"])
gemini_service = GeminiService()


async def _verify_trip_owner(trip_id: str, user_id: str) -> None:
    trip = await get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Trip not found")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user: AuthenticatedUser = Depends(get_current_user)):
    try:
        await _verify_trip_owner(request.trip_id, user.user_id)
        response = await gemini_service.chat_modify(request)
        if response.updated_itinerary:
            await save_trip_change({
                "trip_id": request.trip_id,
                "change_reason": request.message,
                "original_days": request.itinerary.model_dump().get("days"),
                "updated_days": response.updated_itinerary.model_dump().get("days")
            })
        return response
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.post("/replan", response_model=ReplanResponse)
async def replan(request: ReplanRequest, user: AuthenticatedUser = Depends(get_current_user)):
    try:
        await _verify_trip_owner(request.trip_id, user.user_id)
        response = await gemini_service.replan_itinerary(request)
        await save_trip_change({
            "trip_id": request.trip_id,
            "change_reason": f"{request.reason.value}: {request.context}",
            "original_days": request.itinerary.model_dump().get("days"),
            "updated_days": response.updated_itinerary.model_dump().get("days")
        })
        return response
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
