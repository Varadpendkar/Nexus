from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from app.models.contact import ContactForm
from app.services.email import send_notification
from app.services.supabase import save_lead

router = APIRouter()

@router.post("/contact", status_code=status.HTTP_201_CREATED)
async def submit_contact(
    form: ContactForm,
    background_tasks: BackgroundTasks
):
    try:
        record = await save_lead(form)
        background_tasks.add_task(send_notification, form)
        return {
            "success": True,
            "message": "Inquiry received. We will respond within 24 hours.",
            "lead_id": record["id"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while submitting your message: {str(e)}"
        )
