import pytest
from app.schemas import ResumeJSON, PersonalInfo, SkillCategory, EducationItem, ExperienceItem, ProjectItem
from app.services.suggestions_service import SuggestionsService

def test_suggestions_localhost_detection():
    resume = ResumeJSON(
        target_role="Full Stack Engineer",
        personal=PersonalInfo(
            full_name="John Doe",
            email="john@example.com",
            linkedin="http://localhost:3000/profile"
        ),
        summary="Experienced engineer with 5 years in web application development.",
        skills=[SkillCategory(category="Languages", items=["Python"])],
        education=[EducationItem(degree="B.S. CS", institution="MIT", coursework=["Data Structures"])],
        projects=[
            ProjectItem(name="App One", link="http://127.0.0.1:8080", bullets=["Built tool 1 with 10k users."]),
            ProjectItem(name="App Two", link="https://github.com/johndoe/app2", bullets=["Built tool 2 with 5k users."])
        ],
        experience=[
            ExperienceItem(
                title="Software Engineer",
                company="Acme Corp",
                bullets=["Increased throughput by 40% across 10 microservices."]
            )
        ]
    )

    suggestions = SuggestionsService.evaluate_rules(resume)
    suggestion_ids = [s.id for s in suggestions]
    
    assert any("rule_localhost" in s_id for s_id in suggestion_ids)
    localhost_suggestions = [s for s in suggestions if "rule_localhost" in s.id]
    assert len(localhost_suggestions) >= 2 # personal.linkedin and projects.App One

def test_suggestions_emoji_detection():
    resume = ResumeJSON(
        personal=PersonalInfo(
            full_name="Jane Doe 🚀",
            email="jane@example.com",
            phone="📱 +1 555-0199"
        ),
        summary="Software engineer with 4 years building scalable distributed backends.",
        skills=[SkillCategory(category="Backend", items=["Go"])],
        education=[EducationItem(degree="B.S.", institution="Stanford", coursework=["Algorithms"])],
        projects=[
            ProjectItem(name="Proj 1", bullets=["Achieved 99.9% uptime for 1M requests."]),
            ProjectItem(name="Proj 2", bullets=["Reduced latency by 35%."])
        ]
    )

    suggestions = SuggestionsService.evaluate_rules(resume)
    suggestion_ids = [s.id for s in suggestions]
    assert "rule_emoji_full_name" in suggestion_ids or "rule_emoji_phone" in suggestion_ids

def test_suggestions_few_projects_and_unquantified_bullets():
    resume = ResumeJSON(
        personal=PersonalInfo(full_name="Alice Smith", email="alice@example.com"),
        summary="Passionate developer experienced in building web applications.",
        skills=[SkillCategory(category="Tech", items=["JavaScript"])],
        education=[EducationItem(degree="B.S.", institution="Oxford", coursework=["Operating Systems"])],
        projects=[
            # Only 1 project, with unquantified bullet
            ProjectItem(name="Portfolio Site", bullets=["Created a responsive personal website."])
        ],
        experience=[
            ExperienceItem(
                title="Junior Dev",
                company="Startup",
                bullets=["Helped team fix bugs in web app."]
            )
        ]
    )

    suggestions = SuggestionsService.evaluate_rules(resume)
    suggestion_ids = [s.id for s in suggestions]

    assert "rule_few_projects" in suggestion_ids
    assert "rule_unquantified_bullets" in suggestion_ids
    assert "rule_weak_phrasing" in suggestion_ids

def test_suggestions_cgpa_without_scale():
    resume = ResumeJSON(
        personal=PersonalInfo(full_name="Bob Wilson", email="bob@example.com"),
        summary="Backend engineer with 3 years building reliable Python and FastAPI microservices.",
        skills=[SkillCategory(category="Core", items=["Python", "FastAPI"])],
        education=[
            EducationItem(
                degree="B.Tech Computer Science",
                institution="IIT Delhi",
                score="8.8", # Missing /10.0 scale
                coursework=["Distributed Systems"]
            )
        ],
        projects=[
            ProjectItem(name="Proj 1", bullets=["Scaled throughput to 10k RPS."]),
            ProjectItem(name="Proj 2", bullets=["Optimized p99 latency by 50%."])
        ]
    )

    suggestions = SuggestionsService.evaluate_rules(resume)
    suggestion_ids = [s.id for s in suggestions]
    assert any("rule_cgpa_scale" in s_id for s_id in suggestion_ids)

def test_suggestions_missing_summary_and_coursework():
    resume = ResumeJSON(
        personal=PersonalInfo(full_name="Charlie Brown", email="charlie@example.com"),
        summary="", # Missing summary
        skills=[SkillCategory(category="Skills", items=["Java"])],
        education=[
            EducationItem(
                degree="B.S. CS",
                institution="UCLA",
                score="3.9 / 4.0",
                coursework=[] # Missing coursework
            )
        ],
        projects=[
            ProjectItem(name="P1", bullets=["Built cache layer saving 200ms per query."]),
            ProjectItem(name="P2", bullets=["Processed 500k records daily."])
        ]
    )

    suggestions = SuggestionsService.evaluate_rules(resume)
    suggestion_ids = [s.id for s in suggestions]

    assert "rule_missing_summary" in suggestion_ids
    assert "rule_missing_coursework" in suggestion_ids
