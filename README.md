# AI Resume Analyzer & Builder (ATS Compliant)

An interactive full-stack web application designed to help job seekers create ATS-compliant resumes and audit existing resumes against job descriptions using AI.

---

## 📌 Project Overview

Many candidates struggle to get their resumes noticed by recruiters because modern Applicant Tracking Systems (ATS) automatically filter out resumes lacking key technical terms, proper formatting, or quantifiable impact.

**This project solves that problem by:**
1. Allowing users to build clean, ATS-friendly single-column resumes step-by-step.
2. Auditing uploaded resumes (PDF / DOCX) against an industry standard 100-point rubric.
3. Comparing candidate resumes with specific Job Descriptions to identify missing keywords and skills.
4. Providing real-time AI-powered suggestions to improve bullet points and formatting.
5. Offering secure user accounts so users can save resumes, track audit history, and practice interview questions.

---

## 🛠️ Tech Stack

### Frontend
- **React.js (v18) + Vite:** Modern, fast UI development with component-based architecture.
- **Tailwind CSS:** Responsive styling and clean utility-first layout.
- **Lucide React:** Modern icon set.
- **Axios:** REST API integration with token authorization interceptors.
- **React Router (v6):** Client-side routing with protected route guards.

### Backend
- **Python (3.11+):** Core backend language.
- **FastAPI:** High-performance asynchronous REST API framework with automatic Swagger documentation.
- **Pydantic:** Strict schema validation and request/response typing.
- **PyMuPDF & python-docx:** Document text extraction and parsing from `.pdf` and `.docx` files.
- **Google Gemini API:** AI-assisted resume content enhancement and skill gap analysis.

### Database & Authentication
- **SQLite / SQLAlchemy ORM:** Persistent data storage for users, saved resumes, and audit history.
- **JWT (JSON Web Tokens):** Secure, stateless user sessions.
- **Passlib & Bcrypt:** Secure one-way password hashing (salt rounds: 12).

---

## 🔑 Demo Account (For Testing / Evaluation)

To test the application without creating a new account, use the pre-configured demo credentials:

| Field | Demo Value |
| :--- | :--- |
| **Email** | `demo@careerforge.com` |
| **Password** | `password123` |

*(You can also click the **"Auto-fill Demo Credentials"** button directly on the Sign In page.)*

---

## ✨ Key Features

- **Step-by-Step Resume Builder:** Structured form for personal info, education, work experience, projects, skills, and certifications.
- **100-Point ATS Scoring Rubric:**
  - Keyword and role relevance
  - Section completeness (Summary, Experience, Education, Skills)
  - Quantified achievements (metrics and measurable impact)
  - Action verbs and bullet clarity
  - Formatting and parsability
  - Contact links (GitHub, LinkedIn, Email)
- **Keyword & Job Description Matcher:** Paste any job post to see what critical skills your resume is missing.
- **Live Resume Preview & PDF Export:** Real-time preview of the resume formatted for single-column A4 ATS standards.
- **User Dashboard:** Save multiple resume versions, review previous audit scores, and track improvements.
- **Practice Interview Room:** Practice role-specific technical questions based on your resume.

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/)

---

### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create and activate Python virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

Open `.env` in `backend/` and set your configuration:
```env
GEMINI_API_KEYS=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
DATABASE_URL=sqlite:///./data/app.db
JWT_SECRET_KEY=supersecretkey_change_in_production
```

Start the FastAPI backend server:
```bash
python -m uvicorn app.main:app --reload --port 8000
```

> **API Documentation (Swagger UI):** Open `http://127.0.0.1:8000/docs` in your browser.

---

### 2. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend folder
cd frontend

# Install Node modules
npm install

# Start Vite dev server
npm run dev
```

> **Web App:** Open `http://localhost:5173` in your browser.

---

## 📁 Project Directory Structure

```text
AI-Resume-Analyzer/
├── backend/
│   ├── app/
│   │   ├── routers/            # FastAPI API endpoints (auth, resume, ats, jobs, etc.)
│   │   ├── services/           # Business logic (Gemini API, ATS rules, PDF parser)
│   │   ├── auth.py             # JWT token handling and bcrypt password verification
│   │   ├── database.py         # SQLAlchemy engine, session maker, auto-seeding
│   │   ├── models.py           # Database models (User, SavedResume, ATSHistory)
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   └── main.py             # FastAPI entrypoint and CORS setup
│   ├── data/                   # SQLite database directory (auto-created)
│   ├── requirements.txt        # Backend dependencies
│   └── .env.example            # Backend environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios API client functions
│   │   ├── components/         # Reusable UI components (Navbar, ScoreGauge, etc.)
│   │   ├── pages/              # App pages (Home, Login, BuilderWizard, AtsUpload, Dashboard)
│   │   ├── state/              # React Context state management (AuthContext, ResumeContext)
│   │   ├── App.jsx             # Main routing and layout
│   │   └── main.jsx            # React root mount
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite build config
│
├── .gitignore                  # Git ignore rules for node_modules, .env, *.db
└── README.md                   # Project documentation
```

---

## 💡 Key Architectural Decisions & Concepts (Interview Ready)

1. **Why FastAPI over Flask / Django?**
   - FastAPI provides native async support, automatic OpenAPI/Swagger documentation at `/docs`, and fast validation with Pydantic.

2. **How is Authentication secured?**
   - User passwords are never saved in plain text; they are hashed using `bcrypt` with salt rounds.
   - On login, a signed JSON Web Token (JWT) is issued with an expiration time and stored securely on the client.
   - Protected API routes check the `Authorization: Bearer <token>` header to verify user identity.

3. **How does ATS scoring work?**
   - Resumes are parsed using PyMuPDF or python-docx into structured text.
   - The system checks for critical resume sections (Summary, Experience, Education, Skills), action verbs, quantified metrics, contact links, and keyword frequency matching against the target role.

4. **Why SQLite for Development?**
   - Lightweight, zero-configuration embedded database managed via SQLAlchemy ORM, making it easy to run locally or migrate to PostgreSQL/MySQL in production by simply changing the `DATABASE_URL` in `.env`.
