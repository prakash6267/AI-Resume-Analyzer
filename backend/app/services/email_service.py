import os
import smtplib
import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional, Dict, Any

from app.config import settings
from app.schemas import ResumeJSON
from app.services.render_service import render_service

logger = logging.getLogger("proresume.email")

def _send_smtp_email_sync(
    to_email: str,
    subject: str,
    html_body: str,
    pdf_attachment: Optional[bytes] = None,
    attachment_name: str = "Resume.pdf"
) -> Dict[str, Any]:
    """Synchronous SMTP email delivery with fallback to simulation mode."""
    smtp_host = getattr(settings, "SMTP_HOST", "")
    smtp_port = int(getattr(settings, "SMTP_PORT", 587))
    smtp_user = getattr(settings, "SMTP_USER", "")
    smtp_password = getattr(settings, "SMTP_PASSWORD", "")
    from_email = getattr(settings, "SMTP_FROM_EMAIL", "interviews@proresume.com")

    # If SMTP credentials are not configured, simulate delivery cleanly
    if not smtp_host or not smtp_user:
        logger.info(
            f"[EMAIL SIMULATION] Sent to: {to_email} | Subject: '{subject}' | "
            f"Attachment: {'Attached (' + str(len(pdf_attachment)) + ' bytes)' if pdf_attachment else 'None'}"
        )
        return {
            "status": "simulated",
            "delivered": True,
            "recipient": to_email,
            "subject": subject,
            "note": "Email simulated successfully (add SMTP_HOST and SMTP_USER in backend/.env for live SMTP delivery)."
        }

    try:
        msg = MIMEMultipart("mixed")
        msg["From"] = f"ProResume ATS Platform <{from_email}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        # HTML part
        html_part = MIMEText(html_body, "html", "utf-8")
        msg.attach(html_part)

        # PDF Attachment
        if pdf_attachment:
            pdf_part = MIMEApplication(pdf_attachment, _subtype="pdf")
            pdf_part.add_header(
                "Content-Disposition",
                "attachment",
                filename=attachment_name
            )
            msg.attach(pdf_part)

        # Connect and send
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        logger.info(f"[EMAIL DELIVERED] Successfully dispatched email to {to_email} via {smtp_host}")
        return {
            "status": "delivered",
            "delivered": True,
            "recipient": to_email,
            "subject": subject
        }
    except Exception as e:
        logger.error(f"[EMAIL SEND ERROR] Failed to send email to {to_email}: {e}")
        # Return fallback status instead of crashing
        return {
            "status": "error",
            "delivered": False,
            "recipient": to_email,
            "error": str(e)
        }

class EmailService:
    @classmethod
    async def send_interview_invitation(
        cls,
        candidate_name: str,
        candidate_email: str,
        job_title: str,
        company_name: str,
        interview_date: str,
        interview_time: str,
        platform: str,
        meeting_link: str,
        notes: str = ""
    ) -> Dict[str, Any]:
        """Sends an official interview invitation with Google Meet / Zoom meeting link."""
        subject = f"Interview Invitation: {job_title} at {company_name or 'ProResume Partner'}"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }}
            .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; }}
            .title {{ font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }}
            .subtitle {{ font-size: 13px; color: #64748b; margin-top: 4px; }}
            .badge {{ display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #3730a3; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }}
            .details-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }}
            .detail-label {{ color: #64748b; font-weight: 600; }}
            .detail-val {{ color: #0f172a; font-weight: 700; }}
            .join-btn {{ display: block; width: 100%; text-align: center; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 700; font-size: 14px; margin-top: 24px; }}
            .footer {{ margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <span class="badge">Interview Scheduled</span>
              <h1 class="title">Interview Confirmation</h1>
              <p class="subtitle">Position: <strong>{job_title}</strong> at <strong>{company_name or 'Hiring Company'}</strong></p>
            </div>

            <p style="font-size: 14px; line-height: 1.6;">
              Dear <strong>{candidate_name}</strong>,<br><br>
              Congratulations! Your resume has been shortlisted for the <strong>{job_title}</strong> position. We are pleased to invite you to an online video interview.
            </p>

            <div class="details-box">
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-val">{interview_date}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-val">{interview_time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Platform:</span>
                <span class="detail-val">{platform}</span>
              </div>
              {f'<div class="detail-row"><span class="detail-label">Notes:</span><span class="detail-val">{notes}</span></div>' if notes else ''}
            </div>

            <p style="font-size: 12px; color: #475569;">
              Please join the session on time using a working microphone and camera:
            </p>

            <a href="{meeting_link}" class="join-btn" target="_blank">
              Join {platform} Meeting
            </a>

            <div class="footer">
              ProResume ATS Recruitment & Interview Platform &bull; Automated Candidate Scheduling
            </div>
          </div>
        </body>
        </html>
        """

        result = await asyncio.to_thread(
            _send_smtp_email_sync,
            to_email=candidate_email,
            subject=subject,
            html_body=html_body,
            pdf_attachment=None
        )
        return result

    @classmethod
    async def send_resume_pdf(
        cls,
        recipient_email: str,
        subject: str,
        message_body: str,
        resume: ResumeJSON,
        template_id: str = "classic",
        sender_name: str = ""
    ) -> Dict[str, Any]:
        """Renders the resume to PDF and emails it to the recipient with custom note."""
        pdf_bytes = await render_service.render_pdf(resume, template_id)
        candidate_name = resume.personal.full_name or sender_name or "Candidate"
        safe_name = "".join(c for c in candidate_name if c.isalnum() or c in " _-").replace(" ", "_")
        attachment_name = f"{safe_name}_Resume_{template_id}.pdf"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }}
            .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 28px; }}
            .header {{ font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }}
            .body-text {{ font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }}
            .footer {{ margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="card">
            <h2 class="header">Resume Document from {candidate_name}</h2>
            <div class="body-text">{message_body}</div>
            <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
              Attached: <strong>{attachment_name}</strong> (Single-column ATS compliant PDF).
            </p>
            <div class="footer">
              Sent securely via ProResume ATS Platform
            </div>
          </div>
        </body>
        </html>
        """

        result = await asyncio.to_thread(
            _send_smtp_email_sync,
            to_email=recipient_email,
            subject=subject,
            html_body=html_body,
            pdf_attachment=pdf_bytes,
            attachment_name=attachment_name
        )
        return result

email_service = EmailService()
