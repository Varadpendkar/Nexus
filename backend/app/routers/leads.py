from fastapi import APIRouter
from typing import List, Dict, Any
from app.services.supabase import get_all_leads

router = APIRouter()

@router.get("/leads", response_model=List[Dict[str, Any]])
async def list_leads():
    return await get_all_leads()
