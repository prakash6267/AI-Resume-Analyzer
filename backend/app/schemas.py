from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr

# --- Core Resume Data Models ---

class PersonalInfo(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""

class SkillCategory(BaseModel):
    category: str = ""
    items: List[str] = Field(default_factory=list)

class EducationItem(BaseModel):
    degree: str = ""
    institution: str = ""
    start_year: str = ""
    end_year: str = ""
    score: str = ""
    cgpa_scale: str = ""  # e.g. "/10", "/4.0", "%"
    details: str = ""
    coursework: List[str] = Field(default_factory=list)

class ExperienceItem(BaseModel):
    title: str = ""
    company: str = ""
    location: str = ""
    start: str = ""
    end: str = ""
    bullets: List[str] = Field(default_factory=list)

class ProjectItem(BaseModel):
    name: str = ""
    tech: List[str] = Field(default_factory=list)
    link: str = ""
    bullets: List[str] = Field(default_factory=list)

class MissingField(BaseModel):
    field: str = ""
    reason: str = ""

class ResumeJSON(BaseModel):
    target_role: str = ""
    personal: PersonalInfo = Field(default_factory=PersonalInfo)
    summary: str = ""
    skills: List[SkillCategory] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    missing_fields: List[MissingField] = Field(default_factory=list)

# --- Resume Creation Suggestions Models ---

class SuggestionItem(BaseModel):
    id: str
    section: str
    severity: str
    suggestion: str
    why_it_helps: str
    needs_user_input: bool = False
    field_to_fill: str = ""
    suggested_value: str = ""

class ResumeSuggestRequest(BaseModel):
    resume: ResumeJSON
    target_role: Optional[str] = ""
    job_description: Optional[str] = ""

class ResumeSuggestResponse(BaseModel):
    suggestions: List[SuggestionItem] = Field(default_factory=list)

# --- ATS Report Models ---

class RubricCategoryScore(BaseModel):
    category: str
    score: int
    max: int
    notes: str = ""

class ATSIssue(BaseModel):
    id: str
    severity: str
    section: str
    problem: str
    fix: str

class ATSQuestion(BaseModel):
    id: str
    field: str
    question: str
    why_it_helps: str
    est_gain: int

class ATSChange(BaseModel):
    section: str
    before: str
    after: str
    reason: str

class ATSReport(BaseModel):
    score: int
    breakdown: List[RubricCategoryScore] = Field(default_factory=list)
    issues: List[ATSIssue] = Field(default_factory=list)
    matched_keywords: List[str] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    questions: List[ATSQuestion] = Field(default_factory=list)
    changes: List[ATSChange] = Field(default_factory=list)

# --- Interview Questions Models ---

class InterviewQuestion(BaseModel):
    id: str
    category: str  # "Technical Deep-Dive", "Project Architecture", "Behavioral & Leadership", "System Design & Problem-Solving"
    question: str
    context_from_resume: str
    what_interviewer_looks_for: str
    suggested_answer_framework: str
    expected_key_points: List[str] = Field(default_factory=list)

class InterviewQuestionSheet(BaseModel):
    target_role: str
    candidate_name: str
    summary_of_candidate_profile: str = ""
    questions: List[InterviewQuestion] = Field(default_factory=list)
    key_strengths_to_probe: List[str] = Field(default_factory=list)
    suggested_interview_duration_mins: int = 45

# --- Enhancement Response with Interview Prep ---

class ATSEnhanceResponse(BaseModel):
    improved_resume: ResumeJSON
    new_score: int
    old_score: int
    breakdown: List[RubricCategoryScore] = Field(default_factory=list)
    changes: List[ATSChange] = Field(default_factory=list)
    remaining_questions: List[ATSQuestion] = Field(default_factory=list)
    interview_questions: List[InterviewQuestion] = Field(default_factory=list)

# --- Job Portal & Application Models ---

class JobCreateRequest(BaseModel):
    title: str
    company_name: Optional[str] = "TechCorp"
    department: str = "Engineering"
    location: str = "Remote / Hybrid"
    experience_level: str = "3-5 years"
    job_description: str
    required_skills: List[str] = Field(default_factory=list)
    min_ats_cutoff: int = 70

class JobApplyRequest(BaseModel):
    candidate_name: str
    candidate_email: EmailStr
    candidate_phone: Optional[str] = ""
    cover_note: Optional[str] = ""
    resume: ResumeJSON

# --- Automated Interview Scheduling Models ---

class ScheduleInterviewRequest(BaseModel):
    application_id: int
    candidate_name: str
    candidate_email: EmailStr
    job_title: str
    company_name: Optional[str] = ""
    interview_date: str  # "YYYY-MM-DD"
    interview_time: str  # "14:00 (2:00 PM)"
    platform: str = "Google Meet"  # "Google Meet" or "Zoom"
    custom_meeting_link: Optional[str] = ""
    interviewer_notes: Optional[str] = ""

# --- Autonomous AI Interview Evaluation Models ---

class AIEvalTurnRequest(BaseModel):
    job_title: str
    question: str
    candidate_answer: str
    resume_context: Optional[str] = ""
    turn_number: int = 1

class AIEvalTurnResponse(BaseModel):
    score_out_of_10: float
    feedback: str
    strengths_demonstrated: List[str] = Field(default_factory=list)
    improvement_areas: List[str] = Field(default_factory=list)
    next_question: str
    next_question_category: str = "Technical"

class QATurn(BaseModel):
    question: str
    answer: str
    score: float
    feedback: str

class AIFinalReportRequest(BaseModel):
    interview_id: Optional[int] = None
    application_id: Optional[int] = None
    candidate_name: str
    job_title: str
    transcript: List[QATurn]

class AIFinalReportResponse(BaseModel):
    total_score: float
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    hire_recommendation: str  # "Strong Hire", "Hire", "Needs Training", "Reject"
    detailed_summary: str

# --- Chatbot Models ---

class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    resume: Optional[ResumeJSON] = None
    target_role: Optional[str] = ""
    job_description: Optional[str] = ""

class ChatResponse(BaseModel):
    reply: str
    suggested_followups: List[str] = Field(default_factory=list)

# --- Email Resume Models ---

class EmailResumeRequest(BaseModel):
    recipient_email: EmailStr
    subject: str = "My Resume Application"
    message_body: str = "Please find attached my updated ATS-compliant resume."
    resume: ResumeJSON
    template_id: str = "classic"
    sender_name: Optional[str] = ""

# --- Standard API Requests ---

class ResumeGenerateRequest(BaseModel):
    target_role: str
    experience_level: str = "Fresher"
    job_description: Optional[str] = ""
    user_data: Dict[str, Any]

class ResumeRefineRequest(BaseModel):
    resume: ResumeJSON
    section: str
    instruction: str

class ATSScoreRequest(BaseModel):
    resume: ResumeJSON
    target_role: Optional[str] = ""
    job_description: Optional[str] = ""

class UserAnswer(BaseModel):
    question_id: str
    field: str
    answer: str

class ATSEnhanceRequest(BaseModel):
    resume: ResumeJSON
    report: Optional[ATSReport] = None
    target_role: Optional[str] = ""
    job_description: Optional[str] = ""
    user_answers: List[UserAnswer] = Field(default_factory=list)

class RenderPDFRequest(BaseModel):
    resume: ResumeJSON
    template_id: str = "classic"

class TemplateInfo(BaseModel):
    id: str
    name: str
    description: str
    best_for: str
    thumbnail: str
