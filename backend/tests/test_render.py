import pytest
import fitz # PyMuPDF
from app.schemas import ResumeJSON, PersonalInfo, SkillCategory, EducationItem, ExperienceItem, ProjectItem
from app.services.render_service import render_service, clean_url, strip_emojis

sample_resume = ResumeJSON(
    target_role="Frontend Engineer",
    personal=PersonalInfo(
        full_name="Alex River 🚀",
        email="alex.river@example.com",
        phone="📱 +1 555-0199",
        location="New York, NY",
        linkedin="https://linkedin.com/in/alexriver",
        github="http://localhost:3000/alexriver" # Localhost link to test sanitization
    ),
    summary="Frontend Engineer with 3+ years of experience building modern React web applications.",
    skills=[
        SkillCategory(category="Frontend", items=["React", "TypeScript", "Tailwind CSS", "Vite"])
    ],
    education=[
        EducationItem(
            degree="B.S. Software Engineering",
            institution="NYU",
            start_year="2019",
            end_year="2023",
            score="3.9 / 4.0",
            coursework=["Algorithms", "Web Architecture"]
        )
    ],
    experience=[
        ExperienceItem(
            title="Frontend Developer",
            company="Pixel Innovations",
            location="New York, NY",
            start="2023",
            end="Present",
            bullets=[
                "Engineered accessible component library with 45+ components adopted by 12 internal teams.",
                "Boosted lighthouse performance scores from 68 to 96 across core landing pages."
            ]
        )
    ],
    projects=[
        ProjectItem(
            name="Resume Builder",
            tech=["React", "FastAPI"],
            link="http://127.0.0.1:8000/demo",
            bullets=["Created ATS resume generator with 99% parsing accuracy."]
        )
    ]
)

def test_clean_url_strips_localhost():
    assert clean_url("http://localhost:3000/profile") == ""
    assert clean_url("http://127.0.0.1:8000/api") == ""
    assert clean_url("https://github.com/janedoe") == "https://github.com/janedoe"
    assert clean_url("") == ""

def test_strip_emojis():
    assert strip_emojis("Alex River 🚀") == "Alex River"
    assert strip_emojis("📱 +1 555-0199") == "+1 555-0199"
    assert strip_emojis("Clean Text") == "Clean Text"

@pytest.mark.asyncio
async def test_html_render():
    for template_id in ["classic", "modern", "compact"]:
        html = render_service.render_html(sample_resume, template_id)
        assert "Alex River" in html
        assert "Frontend Developer" in html
        assert "alex.river@example.com" in html
        # Ensure emojis are stripped
        assert "🚀" not in html
        assert "📱" not in html
        # Ensure localhost links are not rendered in clean links
        assert "localhost" not in html
        assert "127.0.0.1" not in html

@pytest.mark.asyncio
async def test_pdf_render_and_selectable_text():
    for template_id in ["classic", "modern", "compact"]:
        pdf_bytes = await render_service.render_pdf(sample_resume, template_id)
        assert len(pdf_bytes) > 1000
        
        # Verify text selectability with PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        assert len(doc) >= 1
        page_text = doc[0].get_text()
        page_text_lower = page_text.lower()
        assert "alex river" in page_text_lower
        assert "alex.river@example.com" in page_text_lower
        assert "pixel innovations" in page_text_lower
