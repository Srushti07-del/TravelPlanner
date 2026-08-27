from fastapi import APIRouter
from typing import Dict
from services.image_service import ImageService

router = APIRouter(prefix="/images", tags=["images"])
image_service = ImageService()

@router.get("/")
async def get_destination_image(query: str) -> Dict[str, str]:
    """
    Fetch a dynamic image URL for a given destination query.
    """
    image_url = await image_service.get_image_for_destination(query)
    return {"url": image_url}

@router.get("/multiple")
async def get_multiple_destination_images(query: str, count: int = 3) -> Dict[str, list[str]]:
    """
    Fetch multiple dynamic image URLs for a given destination query.
    """
    image_urls = await image_service.get_images_for_destination(query, count)
    return {"urls": image_urls}
