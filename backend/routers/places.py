from fastapi import APIRouter
from typing import List, Dict
from services.places_service import PlacesService

router = APIRouter(prefix="/places", tags=["places"])
places_service = PlacesService()

@router.get("/search", response_model=List[Dict])
async def search_places(query: str, location: str, type: str = ""):
    return await places_service.search_places(query, location, type)

@router.get("/nearby", response_model=List[Dict])
async def nearby_places(lat: float, lng: float, radius: int = 5000, type: str = ""):
    return await places_service.get_nearby_places(lat, lng, radius, type)
