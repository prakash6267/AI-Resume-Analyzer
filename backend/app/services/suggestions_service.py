import re
import logging
from typing import List, Optional
from pathlib import Path

from app.schemas import ResumeJSON, SuggestionItem, ResumeSuggestResponse
from app.services.gemini_service import gemini_service

logger = logging.getLogger("resumeai.suggestions")

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

def load_prompt(filename: str) -> str:
    with open(PROMPTS_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()

# Emoji detection regex
EMOJI_REGEX = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map symbols
    "\U0001F1E0-\U0001F1FF"  # flags (iOS)
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"  # supplemental symbols
    "\U0001FA70-\U0001FAFF"
    "]+",
    flags=re.UNICODE
)

WEAK_PHRASES = [
    "responsible for", "duties included", "worked on", "assisted with", "assisted in", "assisted", "helped in", "helped with", "helped", "tasked with", "handled the", "was involved in"
]

METRIC_REGEX = re.compile(
    r'(\d+[\d,\.]*\s*(%|percent|k|m|b|x|users|clients|customers|ms|s|sec|min|hrs|hours|days|weeks|months|years|dollars|\$|€|£|₹)|\b\d+\b)',
    re.IGNORECASE
)

class SuggestionsService:
    @classmethod
    def evaluate_rules(cls, resume: ResumeJSON) -> List[SuggestionItem]:
        suggestions: List[SuggestionItem] = []

        # 1. Localhost / 127.0.0.1 Links Check
        all_links = [
            ("personal", "linkedin", resume.personal.linkedin),
            ("personal", "github", resume.personal.github),
            ("personal", "portfolio", resume.personal.portfolio),
        ]
        for proj in resume.projects:
            if proj.link:
                all_links.append(("projects", proj.name, proj.link))

        for sec, label, link in all_links:
            if link and ("localhost" in link.lower() or "127.0.0.1" in link):
                suggestions.append(SuggestionItem(
                    id=f"rule_localhost_{sec}_{label}",
                    section=sec,
                    severity="high",
                    suggestion=f"Local development link detected in {label} ('{link}').",
                    why_it_helps="ATS systems and recruiters cannot access localhost addresses; provide a public live URL or repository link.",
                    needs_user_input=True,
                    field_to_fill=label,
                    suggested_value=""
                ))

        # 2. Emoji / Icon Glyph Check in Personal info
        personal_fields = [
            ("full_name", resume.personal.full_name),
            ("email", resume.personal.email),
            ("phone", resume.personal.phone),
            ("location", resume.personal.location),
            ("linkedin", resume.personal.linkedin),
            ("github", resume.personal.github),
        ]
        for fname, val in personal_fields:
            if val and EMOJI_REGEX.search(val):
                suggestions.append(SuggestionItem(
                    id=f"rule_emoji_{fname}",
                    section="contact",
                    severity="medium",
                    suggestion=f"Emoji or icon character detected in {fname}.",
                    why_it_helps="ATS parsers can misinterpret icon glyphs as invalid characters; use clean plain text.",
                    needs_user_input=False
                ))

        # 3. LinkedIn / GitHub username resemblance check
        if resume.personal.full_name and len(resume.personal.full_name.split()) >= 2:
            name_parts = [p.lower() for p in resume.personal.full_name.split() if len(p) > 2]
            for link_type, link_val in [("LinkedIn", resume.personal.linkedin), ("GitHub", resume.personal.github)]:
                if link_val and "http" in link_val:
                    clean_link = link_val.rstrip("/").split("/")[-1].lower()
                    if clean_link and not any(part in clean_link for part in name_parts):
                        suggestions.append(SuggestionItem(
                            id=f"rule_mismatch_{link_type.lower()}",
                            section="contact",
                            severity="low",
                            suggestion=f"{link_type} handle '{clean_link}' differs significantly from your name '{resume.personal.full_name}'.",
                            why_it_helps="Ensures recruiters verify they are reviewing the correct candidate profile.",
                            needs_user_input=False
                        ))

        # 4. Fewer than 2 projects
        if len(resume.projects) < 2:
            suggestions.append(SuggestionItem(
                id="rule_few_projects",
                section="projects",
                severity="medium",
                suggestion=f"Only {len(resume.projects)} project listed. Consider adding at least 2 technical projects.",
                why_it_helps="Multiple projects demonstrate practical application of diverse skills and tools.",
                needs_user_input=True,
                field_to_fill="projects",
                suggested_value=""
            ))

        # 5. Bullets without numbers / metrics
        unquantified_count = 0
        for exp in resume.experience:
            for b in exp.bullets:
                if b.strip() and not METRIC_REGEX.search(b):
                    unquantified_count += 1
        for proj in resume.projects:
            for b in proj.bullets:
                if b.strip() and not METRIC_REGEX.search(b):
                    unquantified_count += 1

        if unquantified_count > 0:
            suggestions.append(SuggestionItem(
                id="rule_unquantified_bullets",
                section="experience",
                severity="high" if unquantified_count >= 3 else "medium",
                suggestion=f"Found {unquantified_count} bullet(s) without quantifiable metrics or results.",
                why_it_helps="Adding real numbers (e.g. % speedup, data volume, users served) dramatically improves ATS impact scoring.",
                needs_user_input=True,
                field_to_fill="experience",
                suggested_value=""
            ))

        # 6. CGPA without scale
        for idx, edu in enumerate(resume.education):
            if edu.score:
                score_str = edu.score.strip()
                has_scale = "/" in score_str or "%" in score_str or (edu.cgpa_scale and edu.cgpa_scale.strip())
                if re.match(r'^\d+(\.\d+)?$', score_str) and not has_scale:
                    suggestions.append(SuggestionItem(
                        id=f"rule_cgpa_scale_{idx}",
                        section="education",
                        severity="medium",
                        suggestion=f"GPA / Score '{score_str}' for {edu.institution or 'degree'} is missing its grading scale.",
                        why_it_helps="Specify whether this is out of /4.0, /10.0, or percentage so international and automated recruiters interpret it accurately.",
                        needs_user_input=True,
                        field_to_fill="cgpa_scale",
                        suggested_value="/10.0"
                    ))

        # 7. Missing Coursework / Summary / Certifications
        if not resume.summary or len(resume.summary.strip()) < 20:
            suggestions.append(SuggestionItem(
                id="rule_missing_summary",
                section="summary",
                severity="high",
                suggestion="Professional summary is missing or too brief.",
                why_it_helps="A 2-3 line summary at the top helps recruiters immediately identify your core specialization.",
                needs_user_input=True,
                field_to_fill="summary",
                suggested_value=""
            ))

        has_coursework = any(len(edu.coursework) > 0 or ("coursework" in edu.details.lower()) for edu in resume.education)
        if resume.education and not has_coursework:
            suggestions.append(SuggestionItem(
                id="rule_missing_coursework",
                section="education",
                severity="low",
                suggestion="Add relevant coursework (e.g. Data Structures, Cloud Computing, Distributed Systems).",
                why_it_helps="Coursework keywords help ATS match your academic foundation against role requirements.",
                needs_user_input=True,
                field_to_fill="coursework",
                suggested_value=""
            ))

        # 8. Weak Phrases
        weak_count = 0
        for exp in resume.experience:
            for b in exp.bullets:
                if any(wp in b.lower() for wp in WEAK_PHRASES):
                    weak_count += 1
        if weak_count > 0:
            suggestions.append(SuggestionItem(
                id="rule_weak_phrasing",
                section="experience",
                severity="medium",
                suggestion=f"Detected {weak_count} passive phrase(s) like 'responsible for' or 'worked on'.",
                why_it_helps="Replace passive phrases with impactful action verbs (e.g. Engineered, Architected, Automated) to demonstrate ownership.",
                needs_user_input=False
            ))

        return suggestions

    @classmethod
    def get_suggestions(
        cls,
        resume: ResumeJSON,
        target_role: Optional[str] = "",
        job_description: Optional[str] = ""
    ) -> ResumeSuggestResponse:
        # 1. Deterministic Rule Suggestions
        rule_suggestions = cls.evaluate_rules(resume)

        # 2. Gemini Semantic Suggestions
        effective_role = target_role or resume.target_role or "Professional"
        prompt_template = load_prompt("suggest.txt")
        prompt = prompt_template.format(
            target_role=effective_role,
            job_description=job_description or "None provided",
            resume_data=resume.model_dump_json(indent=2)
        )

        try:
            ai_response = gemini_service.call_structured(
                prompt=prompt,
                schema=ResumeSuggestResponse,
                temperature=0.2
            )
            ai_suggestions = ai_response.suggestions or []
        except Exception as e:
            logger.warning(f"Gemini suggestions fallback triggered: {e}")
            ai_suggestions = []

        # Merge & deduplicate suggestions
        merged: List[SuggestionItem] = list(rule_suggestions)
        existing_suggestions_text = {s.suggestion.lower() for s in merged}

        for ai_s in ai_suggestions:
            if ai_s.suggestion.lower() not in existing_suggestions_text:
                merged.append(ai_s)

        # Sort: high -> medium -> low
        severity_map = {"high": 0, "medium": 1, "low": 2}
        merged.sort(key=lambda s: severity_map.get(s.severity.lower(), 3))

        return ResumeSuggestResponse(suggestions=merged)

suggestions_service = SuggestionsService()
