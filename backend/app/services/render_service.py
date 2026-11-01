import os
import re
import sys
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any
from jinja2 import Environment, FileSystemLoader, select_autoescape
from fastapi import HTTPException
import fitz  # PyMuPDF fallback

from app.schemas import ResumeJSON, TemplateInfo

logger = logging.getLogger("proresume.render")

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"])
)

AVAILABLE_TEMPLATES = [
    TemplateInfo(
        id="classic",
        name="Classic Professional",
        description="Traditional serif typography with clean dividing lines. Recommended for corporate, finance, and senior executive positions.",
        best_for="Traditional companies, experienced candidates",
        thumbnail="/templates/classic.png"
    ),
    TemplateInfo(
        id="modern",
        name="Modern Tech",
        description="Sleek sans-serif layout with colored accent borders. Ideal for software engineering, design, and startup roles.",
        best_for="Tech and startup roles",
        thumbnail="/templates/modern.png"
    ),
    TemplateInfo(
        id="compact",
        name="Compact Single-Page",
        description="Space-efficient formatting designed to fit extensive projects and skills into a strictly formatted single page.",
        best_for="Freshers, students, and concise resumes",
        thumbnail="/templates/compact.png"
    )
]

def clean_url(url: str) -> str:
    """Never print localhost or 127.0.0.1 URLs in a resume."""
    if not url:
        return ""
    if "localhost" in url.lower() or "127.0.0.1" in url:
        return ""
    return url.strip()

def strip_emojis(text: str) -> str:
    """Strip emojis or non-standard icon glyphs from resume text."""
    if not text:
        return ""
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"
        "\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF"
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "\U0001F900-\U0001F9FF"
        "\U0001FA70-\U0001FAFF"
        "\u2700-\u27BF"
        "\u2600-\u26FF"
        "]+",
        flags=re.UNICODE
    )
    return emoji_pattern.sub("", text).strip()

def _sync_playwright_render(html_content: str) -> bytes:
    """Runs synchronous Playwright inside worker thread for Windows compatibility."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        page = browser.new_page()
        page.set_content(html_content, wait_until="load")
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0mm", "bottom": "0mm", "left": "0mm", "right": "0mm"}
        )
        browser.close()
        return pdf_bytes

def _pymupdf_fallback_render(resume: ResumeJSON) -> bytes:
    """Bulletproof fallback PDF renderer using PyMuPDF if browser rendering is unavailable."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # Standard A4 in points
    rect = fitz.Rect(40, 40, 555, 802)

    p = resume.personal
    full_text = f"{p.full_name.upper()}\n"
    full_text += f"{p.email} | {p.phone} | {p.location}\n"
    if p.linkedin:
        full_text += f"LinkedIn: {p.linkedin} | GitHub: {p.github}\n"
    full_text += "=" * 60 + "\n\n"

    if resume.summary:
        full_text += f"PROFESSIONAL SUMMARY\n{resume.summary}\n\n"

    if resume.skills:
        full_text += "TECHNICAL SKILLS\n"
        for cat in resume.skills:
            full_text += f"• {cat.category}: {', '.join(cat.items)}\n"
        full_text += "\n"

    if resume.experience:
        full_text += "EXPERIENCE\n"
        for exp in resume.experience:
            full_text += f"{exp.title} - {exp.company} ({exp.start} - {exp.end})\n"
            for b in exp.bullets:
                full_text += f"  - {b}\n"
        full_text += "\n"

    if resume.projects:
        full_text += "PROJECTS\n"
        for proj in resume.projects:
            full_text += f"{proj.name} ({', '.join(proj.tech)})\n"
            for b in proj.bullets:
                full_text += f"  - {b}\n"
        full_text += "\n"

    if resume.education:
        full_text += "EDUCATION\n"
        for edu in resume.education:
            full_text += f"{edu.degree} - {edu.institution} ({edu.start_year} - {edu.end_year}) Score: {edu.score} {edu.cgpa_scale}\n"

    page.insert_textbox(rect, full_text, fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    return doc.tobytes()

class RenderService:
    @staticmethod
    def get_template_list() -> List[TemplateInfo]:
        return AVAILABLE_TEMPLATES

    @classmethod
    def prepare_render_context(cls, resume: ResumeJSON) -> Dict[str, Any]:
        data = resume.model_dump()

        # Clean personal info dictionary
        if "personal" in data and data["personal"]:
            for k, v in data["personal"].items():
                if isinstance(v, str):
                    data["personal"][k] = strip_emojis(v)

        # Build clean plain-text contact line separated by ' | '
        p = resume.personal
        contact_parts = []
        if p.email and p.email.strip():
            contact_parts.append(strip_emojis(p.email.strip()))
        if p.phone and p.phone.strip():
            contact_parts.append(strip_emojis(p.phone.strip()))
        if p.location and p.location.strip():
            contact_parts.append(strip_emojis(p.location.strip()))
        
        linkedin_clean = clean_url(p.linkedin)
        if linkedin_clean:
            contact_parts.append(strip_emojis(linkedin_clean))
            
        github_clean = clean_url(p.github)
        if github_clean:
            contact_parts.append(strip_emojis(github_clean))
            
        portfolio_clean = clean_url(p.portfolio)
        if portfolio_clean:
            contact_parts.append(strip_emojis(portfolio_clean))

        # Sanitize project links
        if "projects" in data:
            for proj in data["projects"]:
                proj["clean_link"] = clean_url(proj.get("link", ""))

        return {
            "resume": data,
            "contact_items": contact_parts
        }

    @classmethod
    def render_html(cls, resume: ResumeJSON, template_id: str = "classic") -> str:
        template_file = f"{template_id}.html"
        try:
            template = jinja_env.get_template(template_file)
        except Exception as e:
            logger.warning(f"Template {template_id} not found, falling back to classic: {e}")
            template = jinja_env.get_template("classic.html")

        context = cls.prepare_render_context(resume)
        return template.render(**context)

    @classmethod
    async def render_pdf(cls, resume: ResumeJSON, template_id: str = "classic") -> bytes:
        html_content = cls.render_html(resume, template_id)
        
        # 1. Primary Render: Synchronous Playwright in Threadpool (Thread-safe & Windows compatible)
        try:
            pdf_bytes = await asyncio.to_thread(_sync_playwright_render, html_content)
            if pdf_bytes and len(pdf_bytes) > 500:
                return pdf_bytes
        except Exception as e:
            logger.warning(f"Playwright rendering encountered issue ({e}). Engaging PyMuPDF document generator fallback...")

        # 2. Secondary Fallback: PyMuPDF Direct Generator
        try:
            fallback_bytes = _pymupdf_fallback_render(resume)
            if fallback_bytes and len(fallback_bytes) > 200:
                logger.info("PDF generated successfully via PyMuPDF fallback engine.")
                return fallback_bytes
        except Exception as fe:
            logger.error(f"PyMuPDF fallback failed: {fe}")

        raise HTTPException(
            status_code=500,
            detail="Failed to generate PDF. Please verify resume content and try again."
        )

render_service = RenderService()
