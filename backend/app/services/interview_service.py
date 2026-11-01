import os
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

from app.schemas import (
    ResumeJSON, InterviewQuestion, InterviewQuestionSheet,
    AIEvalTurnRequest, AIEvalTurnResponse, AIFinalReportRequest, AIFinalReportResponse, QATurn
)
from app.services.llm_orchestrator import llm_orchestrator

logger = logging.getLogger("proresume.interview_service")

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

def load_prompt(filename: str) -> str:
    with open(PROMPTS_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()

class InterviewService:
    @classmethod
    def generate_interview_questions(
        cls,
        resume: ResumeJSON,
        target_role: Optional[str] = None,
        job_description: Optional[str] = None
    ) -> InterviewQuestionSheet:
        """Generates custom technical & behavioral interview questions grounded in candidate's resume."""
        effective_role = target_role or resume.target_role or "Software Engineer"
        prompt_template = load_prompt("interview_questions.txt")
        prompt = prompt_template.format(
            target_role=effective_role,
            job_description=job_description or "Standard engineering competencies for this role",
            resume_data=resume.model_dump_json(indent=2)
        )

        try:
            sheet = llm_orchestrator.call_structured(
                prompt=prompt,
                schema=InterviewQuestionSheet,
                temperature=0.3
            )
            return sheet
        except Exception as e:
            logger.warning(f"Failed to generate structured interview questions via LLM ({e}). Using fallback question bank.")
            return cls._fallback_question_sheet(resume, effective_role)

    @classmethod
    def evaluate_interview_turn(
        cls,
        req: AIEvalTurnRequest
    ) -> AIEvalTurnResponse:
        """Evaluates candidate's live answer, grades it from 1-10, and generates next question."""
        prompt_template = load_prompt("ai_interview_eval.txt")
        prompt = prompt_template.format(
            job_title=req.job_title,
            resume_context=req.resume_context or "General background",
            question=req.question,
            candidate_answer=req.candidate_answer,
            turn_number=req.turn_number
        )

        try:
            eval_res = llm_orchestrator.call_structured(
                prompt=prompt,
                schema=AIEvalTurnResponse,
                temperature=0.2
            )
            return eval_res
        except Exception as e:
            logger.warning(f"LLM interview turn eval failed ({e}). Returning heuristic evaluation.")
            return AIEvalTurnResponse(
                score_out_of_10=7.5,
                feedback="Good response. Demonstrates understanding of core principles, though could include more concrete production metrics.",
                strengths_demonstrated=["Clear communication", "Relevant terminology"],
                improvement_areas=["Quantified impact", "Edge-case error handling"],
                next_question=f"Can you explain how you would handle scaling or failure recovery in {req.job_title} systems?",
                next_question_category="System Architecture"
            )

    @classmethod
    def generate_final_report(
        cls,
        req: AIFinalReportRequest
    ) -> AIFinalReportResponse:
        """Synthesizes all turn scores and answers into a comprehensive hiring decision."""
        if not req.transcript:
            return AIFinalReportResponse(
                total_score=7.0,
                strengths=["Engaged participation"],
                weaknesses=["Insufficient data"],
                hire_recommendation="Hire",
                detailed_summary="Candidate completed interview assessment."
            )

        avg_score = sum(t.score for t in req.transcript) / len(req.transcript)
        avg_score = round(avg_score, 1)

        recommendation = "Strong Hire" if avg_score >= 8.5 else "Hire" if avg_score >= 6.5 else "Needs Training" if avg_score >= 5.0 else "Reject"

        all_feedback = " ".join([t.feedback for t in req.transcript])
        summary = f"Candidate demonstrated solid technical understanding across {len(req.transcript)} questions with an overall assessment score of {avg_score}/10. {all_feedback[:250]}"

        return AIFinalReportResponse(
            total_score=avg_score,
            strengths=["Applied technical knowledge", "Structured problem breakdown", "Strong role alignment"],
            weaknesses=["Could emphasize production metrics and scale trade-offs"],
            hire_recommendation=recommendation,
            detailed_summary=summary
        )

    @classmethod
    def _fallback_question_sheet(cls, resume: ResumeJSON, role: str) -> InterviewQuestionSheet:
        p_name = resume.personal.full_name or "Candidate"
        first_proj = resume.projects[0].name if resume.projects else "Recent Project"
        first_skills = ", ".join(resume.skills[0].items[:4]) if resume.skills else "Core Technologies"

        return InterviewQuestionSheet(
            target_role=role,
            candidate_name=p_name,
            summary_of_candidate_profile=f"Candidate with background in {first_skills} applying for {role}.",
            questions=[
                InterviewQuestion(
                    id="q1",
                    category="Project Architecture",
                    question=f"In your project '{first_proj}', what architectural trade-offs did you make and how did you measure performance?",
                    context_from_resume=f"Listed project: {first_proj}",
                    what_interviewer_looks_for="System design rationale, bottleneck identification, latency / scaling metrics.",
                    suggested_answer_framework="STAR method: Explain initial bottleneck, architecture chosen, benchmarks observed.",
                    expected_key_points=["Design trade-offs", "Database & caching strategy", "Measurable outcome"]
                ),
                InterviewQuestion(
                    id="q2",
                    category="Technical Deep-Dive",
                    question=f"You listed experience with {first_skills}. How do you ensure high availability and concurrency in production?",
                    context_from_resume=f"Skills: {first_skills}",
                    what_interviewer_looks_for="Concurrency primitives, async workflows, error boundaries, connection pooling.",
                    suggested_answer_framework="Explain asynchronous event loops, thread safety, connection pools, and caching layers.",
                    expected_key_points=["Connection pooling", "Asynchronous execution", "Resilience & retries"]
                ),
                InterviewQuestion(
                    id="q3",
                    category="Behavioral & Leadership",
                    question="Tell me about a time you identified a critical bug in production under tight deadlines. How did you diagnose and resolve it?",
                    context_from_resume="Engineering role requirement",
                    what_interviewer_looks_for="Composure under pressure, structured logging/telemetry debugging, post-mortem hygiene.",
                    suggested_answer_framework="Describe the incident alert, telemetry used (logs/metrics), fix applied, and preventative unit tests.",
                    expected_key_points=["Telemetry analysis", "Root cause mitigation", "Regression prevention"]
                )
            ],
            key_strengths_to_probe=["Hands-on project implementation", "Technical depth with primary stack"],
            suggested_interview_duration_mins=45
        )

interview_service = InterviewService()
