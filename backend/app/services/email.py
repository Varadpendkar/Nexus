import logging
from app.models.contact import ContactForm
from app.config import settings

logger = logging.getLogger("nexus.email")

async def send_notification(form: ContactForm) -> bool:
    """
    Sends email notification via Resend or logs it gracefully in development mode.
    """
    logger.info(f"Preparing lead notification for {form.name} ({form.email})")
    if not settings.RESEND_API_KEY:
        logger.info(f"[DEV NOTIFICATION] Lead inquiry received: {form.dict()}")
        return True

    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "NEXUS Leads <onboarding@resend.dev>",
                    "to": [settings.NOTIFICATION_EMAIL],
                    "subject": f"🔥 New NEXUS Lead: {form.name} ({', '.join(form.services) or 'General'})",
                    "html": f"""
                        <h2>New Inquiry from {form.name}</h2>
                        <p><strong>Email:</strong> {form.email}</p>
                        <p><strong>Company:</strong> {form.company or 'N/A'}</p>
                        <p><strong>Services:</strong> {', '.join(form.services)}</p>
                        <p><strong>Budget:</strong> {form.budget}</p>
                        <p><strong>Brief:</strong></p>
                        <blockquote>{form.brief}</blockquote>
                    """
                },
                timeout=10.0
            )
            return resp.status_code in [200, 201]
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
        return False
