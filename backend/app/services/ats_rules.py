import re
from typing import List, Tuple, Dict, Any
from app.schemas import ResumeJSON, ATSIssue

ACTION_VERBS = {
    "accelerated", "accomplished", "achieved", "acquired", "adapted", "administered", "advanced",
    "advised", "analyzed", "architected", "arranged", "assembled", "assessed", "audited", "automated",
    "built", "budgeted", "calculated", "championed", "clarified", "collaborated", "compiled", "composed",
    "conceived", "conducted", "configured", "constructed", "consulted", "converted", "coordinated",
    "crafted", "created", "customized", "debugged", "decreased", "defined", "delegated", "delivered",
    "demonstrated", "deployed", "designed", "detailed", "detected", "developed", "devised", "diagnosed",
    "directed", "discovered", "dispatched", "diversified", "documented", "doubled", "drafted", "drove",
    "eliminated", "enabled", "engineered", "enhanced", "established", "estimated", "evaluated", "examined",
    "executed", "expanded", "expedited", "fabricated", "facilitated", "finalized", "forecasted", "formulated",
    "founded", "generated", "governed", "guided", "handled", "headed", "hired", "identified", "illustrated",
    "implemented", "improved", "increased", "indexed", "influenced", "initiated", "innovated", "inspected",
    "installed", "instituted", "instructed", "integrated", "interviewed", "introduced", "invented", "investigated",
    "launched", "lead", "led", "leveraged", "maintained", "managed", "mapped", "maximized", "mentored",
    "migrated", "minimized", "modeled", "modernized", "monitored", "motivated", "negotiated", "obtained",
    "operated", "optimized", "orchestrated", "organized", "originated", "overhauled", "oversaw", "partnered",
    "performed", "piloted", "pioneered", "planned", "prepared", "presented", "produced", "programmed",
    "promoted", "proposed", "published", "quantified", "re-engineered", "rebuilt", "recommended", "reconciled",
    "redesigned", "reduced", "refined", "refactored", "regulated", "remodeled", "reorganized", "repaired",
    "replaced", "researched", "resolved", "restructured", "revamped", "reviewed", "revitalized", "routed",
    "scaled", "scheduled", "screened", "secured", "selected", "separated", "simplified", "simulated",
    "solved", "spearheaded", "standardized", "streamlined", "strengthened", "structured", "supervised",
    "surpassed", "synthesized", "systematized", "tabulated", "targeted", "taught", "tested", "tracked",
    "trained", "transformed", "translated", "tripled", "troubleshot", "unified", "upgraded", "utilized",
    "validated", "visualized", "won", "wrote"
}

WEAK_PHRASES = [
    "responsible for", "duties included", "worked on", "assisted with", "helped in", "tasked with",
    "handled the", "was involved in", "participated in", "took part in"
]

METRIC_REGEX = re.compile(
    r'(\d+[\d,\.]*\s*(%|percent|k|m|b|x|users|clients|customers|ms|s|sec|min|hrs|hours|days|weeks|months|years|dollars|\$|€|£|₹)|\b\d+\b)',
    re.IGNORECASE
)

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
PHONE_REGEX = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')

class ATSRulesEngine:
    @classmethod
    def evaluate(cls, resume: ResumeJSON) -> Dict[str, Any]:
        issues: List[ATSIssue] = []
        
        # 1. Section Completeness (Max 15)
        section_score = 0
        if resume.personal.full_name and (resume.personal.email or resume.personal.phone):
            section_score += 3
        else:
            issues.append(ATSIssue(
                id="missing_contact",
                severity="high",
                section="personal",
                problem="Contact information is incomplete.",
                fix="Ensure your name, email, and phone number are clearly provided."
            ))
            
        if resume.summary and len(resume.summary.strip()) > 30:
            section_score += 3
        else:
            issues.append(ATSIssue(
                id="missing_summary",
                severity="medium",
                section="summary",
                problem="Professional summary is missing or too short.",
                fix="Add a 2-4 line tailored professional summary emphasizing your core skills and achievements."
            ))
            
        skill_count = sum(len(cat.items) for cat in resume.skills)
        if skill_count >= 5:
            section_score += 3
        elif skill_count > 0:
            section_score += 2
            issues.append(ATSIssue(
                id="few_skills",
                severity="medium",
                section="skills",
                problem=f"Only {skill_count} skills listed.",
                fix="Group your technical skills into distinct categories with 6-12 relevant keywords."
            ))
        else:
            issues.append(ATSIssue(
                id="missing_skills",
                severity="high",
                section="skills",
                problem="No skills found.",
                fix="Add technical and domain skills relevant to the target role."
            ))

        if resume.education and len(resume.education) > 0:
            section_score += 3
        else:
            issues.append(ATSIssue(
                id="missing_education",
                severity="medium",
                section="education",
                problem="Education section is missing.",
                fix="Add your degree, university name, and graduation year."
            ))

        has_exp = len(resume.experience) > 0
        has_proj = len(resume.projects) > 0
        if has_exp or has_proj:
            section_score += 3
        else:
            issues.append(ATSIssue(
                id="missing_experience_projects",
                severity="high",
                section="experience",
                problem="Both experience and project sections are empty.",
                fix="Add relevant work experience or key technical projects."
            ))

        # 2. Contact and Links (Max 5)
        contact_score = 0
        if resume.personal.email and EMAIL_REGEX.search(resume.personal.email.strip()):
            contact_score += 2
        elif resume.personal.email:
            contact_score += 1
            
        if resume.personal.phone and PHONE_REGEX.search(resume.personal.phone.strip()):
            contact_score += 1
        elif resume.personal.phone:
            contact_score += 1

        if resume.personal.linkedin or resume.personal.github or resume.personal.portfolio:
            contact_score += 2
        else:
            issues.append(ATSIssue(
                id="missing_links",
                severity="low",
                section="personal",
                problem="No LinkedIn, GitHub, or Portfolio links provided.",
                fix="Add active links to your LinkedIn profile or GitHub repository."
            ))
        contact_score = min(5, contact_score)

        # Collect all bullet points
        all_bullets: List[Tuple[str, str]] = [] # (section_name, bullet_text)
        for exp in resume.experience:
            for b in exp.bullets:
                if b.strip():
                    all_bullets.append(("experience", b.strip()))
        for proj in resume.projects:
            for b in proj.bullets:
                if b.strip():
                    all_bullets.append(("projects", b.strip()))

        # 3. Quantified Achievements (Max 15)
        quantified_score = 0
        metric_bullets = [b for sec, b in all_bullets if METRIC_REGEX.search(b)]
        total_bullets = len(all_bullets)
        if total_bullets > 0:
            ratio = len(metric_bullets) / total_bullets
            if ratio >= 0.5:
                quantified_score = 15
            elif ratio >= 0.3:
                quantified_score = 11
            elif ratio >= 0.15:
                quantified_score = 7
            else:
                quantified_score = 4
                issues.append(ATSIssue(
                    id="low_metrics",
                    severity="high",
                    section="experience",
                    problem="Few bullets contain measurable results or metrics.",
                    fix="Quantify your achievements with numbers, percentages, user counts, or performance gains (e.g. 'reduced latency by 35%')."
                ))
        else:
            quantified_score = 3
            issues.append(ATSIssue(
                id="no_bullets",
                severity="high",
                section="experience",
                problem="No bullet points found in experience or projects.",
                fix="Add 2-4 descriptive, achievement-focused bullet points per role/project."
            ))

        # 4. Action Verbs & Quality (Max 10)
        action_verb_score = 10
        weak_count = 0
        non_action_count = 0
        for sec, b in all_bullets:
            b_lower = b.lower()
            # Check weak phrases
            for wp in WEAK_PHRASES:
                if wp in b_lower:
                    weak_count += 1
            # Check starting verb
            first_word = re.sub(r'[^a-zA-Z]', '', b_lower.split()[0]) if b_lower.split() else ""
            if first_word not in ACTION_VERBS and not first_word.endswith("ed"):
                non_action_count += 1

        if weak_count > 0:
            action_verb_score -= min(4, weak_count * 2)
            issues.append(ATSIssue(
                id="weak_verbs",
                severity="medium",
                section="experience",
                problem=f"Found {weak_count} passive phrasing instances (e.g. 'responsible for').",
                fix="Replace passive phrases with strong action verbs like 'Engineered', 'Orchestrated', 'Optimized'."
            ))

        if total_bullets > 0 and (non_action_count / total_bullets) > 0.4:
            action_verb_score -= 2
            issues.append(ATSIssue(
                id="missing_action_verbs",
                severity="medium",
                section="experience",
                problem="Several bullet points do not begin with clear action verbs.",
                fix="Ensure each bullet begins with a past-tense action verb describing your specific contribution."
            ))
        action_verb_score = max(2, min(10, action_verb_score))

        # 5. Formatting and Parsability (Max 15)
        formatting_score = 15
        # 6. Length and Readability (Max 5)
        length_score = 5
        total_words = len(resume.summary.split())
        for cat in resume.skills:
            total_words += len(" ".join(cat.items).split())
        for exp in resume.experience:
            total_words += len((exp.title + " " + exp.company + " " + " ".join(exp.bullets)).split())
        for proj in resume.projects:
            total_words += len((proj.name + " " + " ".join(proj.bullets)).split())

        if total_words < 50:
            length_score = 2
            issues.append(ATSIssue(
                id="resume_too_short",
                severity="high",
                section="formatting",
                problem="Resume content is too sparse for ATS parsing.",
                fix="Expand on project details, technical skills, and responsibilities."
            ))
        elif total_words > 1200:
            length_score = 3
            issues.append(ATSIssue(
                id="resume_too_long",
                severity="low",
                section="formatting",
                problem="Resume content exceeds recommended length.",
                fix="Condense older bullet points to fit a crisp 1 or 2 page structure."
            ))

        # 7. Grammar & Date Consistency (Max 10)
        grammar_score = 8 # Default high, adjusted by AI analysis
        
        return {
            "section_score": section_score,
            "contact_score": contact_score,
            "quantified_score": quantified_score,
            "action_verb_score": action_verb_score,
            "formatting_score": formatting_score,
            "length_score": length_score,
            "grammar_score": grammar_score,
            "issues": issues,
            "total_bullets": total_bullets,
            "metric_bullets_count": len(metric_bullets)
        }
