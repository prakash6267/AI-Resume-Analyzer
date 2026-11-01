import pytest
from app.schemas import ResumeJSON, PersonalInfo, SkillCategory, EducationItem, ExperienceItem, ProjectItem
from app.services.ats_rules import ATSRulesEngine

def test_ats_rules_good_resume():
    resume = ResumeJSON(
        target_role="Full Stack Engineer",
        personal=PersonalInfo(
            full_name="Jane Doe",
            email="jane.doe@example.com",
            phone="+1 (555) 123-4567",
            location="San Francisco, CA",
            linkedin="https://linkedin.com/in/janedoe",
            github="https://github.com/janedoe"
        ),
        summary="Results-driven Full Stack Engineer with 4+ years of experience architecting scalable React and FastAPI microservices.",
        skills=[
            SkillCategory(category="Languages", items=["Python", "TypeScript", "JavaScript", "SQL"]),
            SkillCategory(category="Frameworks", items=["React", "FastAPI", "Node.js", "Docker", "PostgreSQL"])
        ],
        education=[
            EducationItem(
                degree="B.S. in Computer Science",
                institution="University of California, Berkeley",
                start_year="2018",
                end_year="2022",
                score="3.8 GPA"
            )
        ],
        experience=[
            ExperienceItem(
                title="Software Engineer",
                company="TechCorp Inc.",
                location="San Francisco, CA",
                start="2022",
                end="Present",
                bullets=[
                    "Architected high-throughput RESTful API handling 2.5M daily requests with 99.9% uptime.",
                    "Optimized database query performance, reducing p95 latency by 42% across core endpoints.",
                    "Engineered real-time notification service utilizing WebSockets, accelerating client updates by 5x."
                ]
            )
        ],
        projects=[
            ProjectItem(
                name="AI Resume Analyzer",
                tech=["React", "FastAPI", "Gemini API"],
                link="https://github.com/janedoe/resume-ai",
                bullets=[
                    "Developed end-to-end ATS scanner parsing resumes in under 800ms.",
                    "Implemented automated scoring rubric analyzing 8 core hiring dimensions."
                ]
            )
        ]
    )

    results = ATSRulesEngine.evaluate(resume)
    assert results["section_score"] == 15
    assert results["contact_score"] == 5
    assert results["quantified_score"] >= 11
    assert results["action_verb_score"] >= 8
    assert results["formatting_score"] == 15
    assert results["length_score"] == 5

def test_ats_rules_weak_resume():
    weak_resume = ResumeJSON(
        target_role="Developer",
        personal=PersonalInfo(full_name="John Doe"),
        summary="",
        skills=[],
        education=[],
        experience=[
            ExperienceItem(
                title="Intern",
                company="XYZ Corp",
                bullets=[
                    "Responsible for helping with bugs.",
                    "Worked on various tasks."
                ]
            )
        ]
    )

    results = ATSRulesEngine.evaluate(weak_resume)
    assert results["section_score"] < 10
    assert results["quantified_score"] <= 4
    assert len(results["issues"]) > 0
    # Check that weak verbs were flagged
    issue_ids = [iss.id for iss in results["issues"]]
    assert "missing_summary" in issue_ids or "missing_skills" in issue_ids
