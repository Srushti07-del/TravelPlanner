from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse, ReplanRequest, ReplanResponse
from services.gemini_service import GeminiService
from db.supabase_client import save_trip_change

router = APIRouter(prefix="/ai", tags=["ai"])
gemini_service = GeminiService()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = await gemini_service.chat_modify(request)
        if response.updated_itinerary:
            await save_trip_change({
                "trip_id": request.trip_id,
                "change_reason": request.message,
                "original_days": request.itinerary.model_dump().get("days"),
                "updated_days": response.updated_itinerary.model_dump().get("days")
            })
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/replan", response_model=ReplanResponse)
async def replan(request: ReplanRequest):
    try:
        response = await gemini_service.replan_itinerary(request)
        await save_trip_change({
            "trip_id": request.trip_id,
            "change_reason": f"{request.reason.value}: {request.context}",
            "original_days": request.itinerary.model_dump().get("days"),
            "updated_days": response.updated_itinerary.model_dump().get("days")
        })
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
