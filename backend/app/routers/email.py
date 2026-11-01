import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas import EmailResumeRequest
from app.services.email_service import email_service

logger = logging.getLogger("proresume.router.email")
router = APIRouter(prefix="/api/email", tags=["Mail Service"])

@router.post("/send-resume")
async def email_resume(payload: EmailResumeRequest):
    """
    Renders the ATS-compliant PDF resume and emails it directly to the specified recipient.
    Supports standard SMTP configuration in backend/.env with simulation fallback.
    """
    try:
        result = await email_service.send_resume_pdf(
            recipient_email=payload.recipient_email,
            subject=payload.subject,
            message_body=payload.message_body,
            resume=payload.resume,
            template_id=payload.template_id,
            sender_name=payload.sender_name
        )

        return {
            "message": f"Resume PDF sent to {payload.recipient_email} successfully!",
            "delivery": result
        }
    except Exception as e:
        logger.error(f"Error emailing resume: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to email resume: {str(e)}"
        )
