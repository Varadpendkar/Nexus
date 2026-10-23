import logging
import uuid
from datetime import datetime
from typing import List, Dict, Any
from app.models.contact import ContactForm
from app.config import settings

logger = logging.getLogger("nexus.db")

# In-memory storage fallback for local development or when Supabase keys are not configured
in_memory_leads: List[Dict[str, Any]] = []

async def save_lead(form: ContactForm) -> Dict[str, Any]:
    """
    Saves lead to Supabase or in-memory fallback.
    """
    lead_id = str(uuid.uuid4())
    record = {
        "id": lead_id,
        "name": form.name,
        "email": form.email,
        "company": form.company,
        "services": form.services,
        "budget": form.budget,
        "brief": form.brief,
        "status": "new",
        "created_at": datetime.utcnow().isoformat()
    }
    
    in_memory_leads.append(record)
    logger.info(f"Lead saved successfully. ID: {lead_id}")

    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{settings.SUPABASE_URL}/rest/v1/leads",
                    headers={
                        "apikey": settings.SUPABASE_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    json=record,
                    timeout=5.0
                )
        except Exception as e:
            logger.warning(f"Could not write to Supabase (stored in fallback): {e}")

    return record

async def get_all_leads() -> List[Dict[str, Any]]:
    return in_memory_leads
