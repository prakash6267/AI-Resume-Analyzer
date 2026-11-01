import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ArrowLeft, Check, Plus, Trash2, 
  Loader2, User, GraduationCap, Wrench, Briefcase, FolderGit2, Award, FileText, Layers, FileCheck2
} from 'lucide-react';
import { generateResume, getResumeSuggestions } from '../api/client';
import { useResume } from '../state/ResumeContext';

const sampleFresherData = {
  target_role: "Junior Full Stack Engineer",
  experience_level: "Fresher",
  job_description: "Looking for an energetic Junior Developer skilled in React, TypeScript, Python, and REST APIs with strong problem-solving skills.",
  personal: {
    full_name: "Samantha Reed",
    email: "samantha.reed@example.com",
    phone: "+1 (555) 234-5678",
    location: "Austin, TX",
    linkedin: "https://linkedin.com/in/samanthareed",
    github: "https://github.com/samanthareed",
    portfolio: "https://samanthareed.dev"
  },
  education: [
    {
      degree: "B.S. in Computer Science",
      institution: "University of Texas at Austin",
      start_year: "2020",
      end_year: "2024",
      score: "3.85",
      cgpa_scale: "/4.0",
      details: "Dean's List (All Semesters)",
      coursework: ["Data Structures", "Web Development", "Cloud Computing", "Database Systems"]
    }
  ],
  skills: [
    { category: "Languages", items: ["Python", "JavaScript", "TypeScript", "SQL", "HTML5", "CSS3"] },
    { category: "Frameworks & Libraries", items: ["React", "FastAPI", "Express.js", "Tailwind CSS", "Node.js"] },
    { category: "Tools & Platforms", items: ["Git", "GitHub", "Docker", "PostgreSQL", "Postman", "Linux"] }
  ],
  projects: [
    {
      name: "AI Resume Analyzer & Builder",
      tech: ["React", "FastAPI", "Google Gemini API", "Tailwind CSS"],
      link: "https://github.com/samanthareed/resume-ai",
      bullets: [
        "Architected an automated ATS scoring engine auditing resumes across 8 core hiring dimensions.",
        "Built responsive multi-step React frontend integrated with FastAPI endpoints.",
        "Engineered serverless PDF generation using Playwright rendering pixel-perfect A4 resumes."
      ]
    },
    {
      name: "E-Commerce Cloud Microservices",
      tech: ["Node.js", "Express", "PostgreSQL", "Docker", "Redis"],
      link: "https://github.com/samanthareed/shop-micro",
      bullets: [
        "Implemented JWT authentication and payment checkout handling 500+ simulated concurrent users.",
        "Configured Redis caching layer reducing database read latencies by 45%."
      ]
    }
  ],
  experience: [
    {
      title: "Software Engineering Intern",
      company: "InnovateTech Labs",
      location: "Austin, TX",
      start: "Jun 2023",
      end: "Aug 2023",
      bullets: [
        "Developed 6 reusable React UI components for the customer analytics dashboard.",
        "Assisted in migrating legacy SQL queries to indexed views, improving query throughput by 25%."
      ]
    }
  ],
  certifications: ["AWS Certified Cloud Practitioner (2024)", "Meta Frontend Developer Professional Certificate"],
  achievements: ["Dean's Honor List (2020-2024)", "1st Place at UT Hackathon 2023 (out of 75 teams)"],
  free_text: "Enthusiastic about distributed systems, modern frontend UI/UX, and clean software architecture."
};

const STEPS = [
  { id: 1, name: 'Target Role', icon: Layers },
  { id: 2, name: 'Personal Details', icon: User },
  { id: 3, name: 'Education', icon: GraduationCap },
  { id: 4, name: 'Skills', icon: Wrench },
  { id: 5, name: 'Projects', icon: FolderGit2 },
  { id: 6, name: 'Experience', icon: Briefcase },
  { id: 7, name: 'Extras & Build', icon: Award }
];

export default function BuilderWizard() {
  const navigate = useNavigate();
  const { setResume, setSuggestions, setTargetRole, setJobDescription } = useResume();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    target_role: "Full Stack Developer",
    experience_level: "1-3",
    job_description: "",
    personal: {
      full_name: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: ""
    },
    education: [
      { degree: "", institution: "", start_year: "", end_year: "", score: "", cgpa_scale: "/10.0", details: "", coursework: [] }
    ],
    skills: [
      { category: "Languages & Frameworks", items: [] },
      { category: "Tools & Databases", items: [] }
    ],
    projects: [
      { name: "", tech: [], link: "", bullets: [""] }
    ],
    experience: [
      { title: "", company: "", location: "", start: "", end: "", bullets: [""] }
    ],
    certifications: [],
    achievements: [],
    free_text: ""
  });

  const loadSample = () => {
    setFormData(sampleFresherData);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const generatedResume = await generateResume({
        target_role: formData.target_role || "Professional",
        experience_level: formData.experience_level || "Fresher",
        job_description: formData.job_description,
        user_data: formData
      });

      setResume(generatedResume);
      setTargetRole(formData.target_role);
      setJobDescription(formData.job_description);

      // Generate initial suggestions
      try {
        const suggestRes = await getResumeSuggestions(
          generatedResume,
          formData.target_role,
          formData.job_description
        );
        setSuggestions(suggestRes.suggestions || []);
      } catch (sErr) {
        console.warn("Initial suggestions fetch:", sErr);
      }

      navigate('/review');
    } catch (err) {
      console.error("Generation error:", err);
      const detail = err.response?.data?.detail || "AI service is busy, please try again in a minute.";
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Executive Resume Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enter your background or load professional sample data. Structures your experience with verified metrics into ATS-ready format.
          </p>
        </div>

        <button
          onClick={loadSample}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span>Load Professional Sample</span>
        </button>
      </div>

      {/* Wizard Step Progress Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[620px]">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 ${
                      isCurrent ? 'text-indigo-600' : 'text-slate-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded ${
                      currentStep > step.id ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-100 mb-8 min-h-[400px]">
        {/* Step 1: Target Role */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Target Job Role & Experience</h2>
              <p className="text-xs text-slate-500">The ATS engine uses this to align keywords and phrasing without fabricating skills.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Job Role *</label>
                <input
                  type="text"
                  value={formData.target_role}
                  onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                  placeholder="e.g. Frontend Developer, Data Analyst, Cloud Architect"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Experience Level</label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Fresher">Fresher / Student (0-1 yrs)</option>
                  <option value="1-3">Early Career (1-3 yrs)</option>
                  <option value="3-7">Mid-Level (3-7 yrs)</option>
                  <option value="7+ years">Senior / Lead (7+ yrs)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Job Description (Optional for Keyword Alignment)
              </label>
              <textarea
                rows={4}
                value={formData.job_description}
                onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                placeholder="Paste the job posting description here to identify key industry terms..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Personal Details */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Personal & Contact Details</h2>
              <p className="text-xs text-slate-500">Contact information formatted cleanly with plain-text separators.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.personal.full_name}
                  onChange={(e) => setFormData({ ...formData, personal: { ...formData.personal, full_name: e.target.value } })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.personal.email}
                  onChange={(e) => setFormData({ ...formData, personal: { ...formData.personal, email: e.target.value } })}
                  placeholder="e.g. john@example.com"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={formData.personal.phone}
                  onChange={(e) => setFormData({ ...formData, personal: { ...formData.personal, phone: e.target.value } })}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location (City, State)</label>
                <input
                  type="text"
                  value={formData.personal.location}
                  onChange={(e) => setFormData({ ...formData, personal: { ...formData.personal, location: e.target.value } })}
                  placeholder="e.g. New York, NY"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile Link</label>
                <input
                  type="text"
                  value={formData.personal.linkedin}
                  onChange={(e) => setFormData({ ...formData, personal: { ...formData.personal, linkedin: e.target.value } })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Profile Link</label>
                <input
                  type="text"
                  value={formData.personal.github}
                  onChange={(e) => setFormData({ ...formData, personal: { ...formData.personal, github: e.target.value } })}
                  placeholder="https://github.com/username"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Education */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Education & Academics</h2>
                <p className="text-xs text-slate-500">Add degree, institution, CGPA scale, and notable coursework.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  education: [...formData.education, { degree: "", institution: "", start_year: "", end_year: "", score: "", cgpa_scale: "/10.0", details: "", coursework: [] }]
                })}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Degree</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.education.map((edu, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Degree #{idx + 1}</span>
                    {formData.education.length > 1 && (
                      <button
                        onClick={() => setFormData({ ...formData, education: formData.education.filter((_, i) => i !== idx) })}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const list = [...formData.education];
                        list[idx].degree = e.target.value;
                        setFormData({ ...formData, education: list });
                      }}
                      placeholder="Degree (e.g. B.Tech Computer Science)"
                      className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const list = [...formData.education];
                        list[idx].institution = e.target.value;
                        setFormData({ ...formData, education: list });
                      }}
                      placeholder="Institution (e.g. Stanford University)"
                      className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={edu.start_year}
                        onChange={(e) => {
                          const list = [...formData.education];
                          list[idx].start_year = e.target.value;
                          setFormData({ ...formData, education: list });
                        }}
                        placeholder="Start Year (2020)"
                        className="w-1/2 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={edu.end_year}
                        onChange={(e) => {
                          const list = [...formData.education];
                          list[idx].end_year = e.target.value;
                          setFormData({ ...formData, education: list });
                        }}
                        placeholder="Grad Year (2024)"
                        className="w-1/2 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={edu.score}
                        onChange={(e) => {
                          const list = [...formData.education];
                          list[idx].score = e.target.value;
                          setFormData({ ...formData, education: list });
                        }}
                        placeholder="Score / GPA (e.g. 8.8 or 3.85)"
                        className="w-1/2 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <select
                        value={edu.cgpa_scale || "/10.0"}
                        onChange={(e) => {
                          const list = [...formData.education];
                          list[idx].cgpa_scale = e.target.value;
                          setFormData({ ...formData, education: list });
                        }}
                        className="w-1/2 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="/10.0">Scale: /10.0</option>
                        <option value="/4.0">Scale: /4.0</option>
                        <option value="%">Scale: % (Percentage)</option>
                        <option value="">No Scale</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Relevant Coursework (comma separated)
                    </label>
                    <input
                      type="text"
                      value={edu.coursework?.join(', ') || ''}
                      onChange={(e) => {
                        const list = [...formData.education];
                        list[idx].coursework = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setFormData({ ...formData, education: list });
                      }}
                      placeholder="e.g. Data Structures, Cloud Computing, Operating Systems, Database Systems"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Skills */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Technical Skills</h2>
                <p className="text-xs text-slate-500">
                  Enter only the skills you know. Gemini will strictly use your entered skills and never invent extras.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  skills: [...formData.skills, { category: "New Category", items: [] }]
                })}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.skills.map((cat, catIdx) => (
                <div key={catIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={cat.category}
                      onChange={(e) => {
                        const list = [...formData.skills];
                        list[catIdx].category = e.target.value;
                        setFormData({ ...formData, skills: list });
                      }}
                      className="font-bold text-xs text-slate-800 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none px-1 py-0.5"
                    />
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        skills: formData.skills.filter((_, i) => i !== catIdx)
                      })}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {cat.items.map((item, itemIdx) => (
                      <span key={itemIdx} className="inline-flex items-center bg-white border border-slate-300 text-slate-800 text-xs px-2.5 py-1 rounded-lg">
                        <span>{item}</span>
                        <button
                          onClick={() => {
                            const list = [...formData.skills];
                            list[catIdx].items = list[catIdx].items.filter((_, i) => i !== itemIdx);
                            setFormData({ ...formData, skills: list });
                          }}
                          className="text-slate-400 hover:text-rose-600 ml-1.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      id={`wizard-skill-input-${catIdx}`}
                      placeholder="Type skill & press Enter or click Add (e.g. React, Python)"
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val && !cat.items.includes(val)) {
                            const list = [...formData.skills];
                            list[catIdx].items.push(val);
                            setFormData({ ...formData, skills: list });
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`wizard-skill-input-${catIdx}`);
                        if (el && el.value.trim()) {
                          const val = el.value.trim();
                          if (!cat.items.includes(val)) {
                            const list = [...formData.skills];
                            list[catIdx].items.push(val);
                            setFormData({ ...formData, skills: list });
                          }
                          el.value = '';
                        }
                      }}
                      className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Projects */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Key Technical Projects</h2>
                <p className="text-xs text-slate-500">Provide public repository or live demo links (never localhost).</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  projects: [...formData.projects, { name: "", tech: [], link: "", bullets: [""] }]
                })}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.projects.map((proj, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Project #{idx + 1}</span>
                    <button
                      onClick={() => setFormData({ ...formData, projects: formData.projects.filter((_, i) => i !== idx) })}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => {
                        const list = [...formData.projects];
                        list[idx].name = e.target.value;
                        setFormData({ ...formData, projects: list });
                      }}
                      placeholder="Project Name (e.g. Distributed Cache Engine)"
                      className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={proj.link}
                      onChange={(e) => {
                        const list = [...formData.projects];
                        list[idx].link = e.target.value;
                        setFormData({ ...formData, projects: list });
                      }}
                      placeholder="Public Project URL (e.g. https://github.com/alex/cache)"
                      className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <input
                    type="text"
                    value={proj.tech.join(', ')}
                    onChange={(e) => {
                      const list = [...formData.projects];
                      list[idx].tech = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setFormData({ ...formData, projects: list });
                    }}
                    placeholder="Technologies Used (e.g. React, Node.js, Redis, Docker)"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg mb-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Bullets */}
                  <div className="space-y-1.5">
                    {proj.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">•</span>
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const list = [...formData.projects];
                            list[idx].bullets[bIdx] = e.target.value;
                            setFormData({ ...formData, projects: list });
                          }}
                          placeholder="Outcome with real metrics (e.g. reduced p95 latency by 35%)..."
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            const list = [...formData.projects];
                            list[idx].bullets = list[idx].bullets.filter((_, i) => i !== bIdx);
                            setFormData({ ...formData, projects: list });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const list = [...formData.projects];
                        list[idx].bullets.push("");
                        setFormData({ ...formData, projects: list });
                      }}
                      className="text-[11px] text-indigo-600 font-bold hover:underline"
                    >
                      + Add Bullet Point
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Experience */}
        {currentStep === 6 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Work Experience</h2>
                <p className="text-xs text-slate-500">Full-time, part-time, or internship roles.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  experience: [...formData.experience, { title: "", company: "", location: "", start: "", end: "", bullets: [""] }]
                })}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Experience</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.experience.map((exp, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Role #{idx + 1}</span>
                    <button
                      onClick={() => setFormData({ ...formData, experience: formData.experience.filter((_, i) => i !== idx) })}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => {
                        const list = [...formData.experience];
                        list[idx].title = e.target.value;
                        setFormData({ ...formData, experience: list });
                      }}
                      placeholder="Job Title (e.g. Software Engineer)"
                      className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const list = [...formData.experience];
                        list[idx].company = e.target.value;
                        setFormData({ ...formData, experience: list });
                      }}
                      placeholder="Company Name (e.g. Acme Corp)"
                      className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => {
                        const list = [...formData.experience];
                        list[idx].location = e.target.value;
                        setFormData({ ...formData, experience: list });
                      }}
                      placeholder="Location (e.g. Austin, TX)"
                      className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={exp.start}
                        onChange={(e) => {
                          const list = [...formData.experience];
                          list[idx].start = e.target.value;
                          setFormData({ ...formData, experience: list });
                        }}
                        placeholder="Start (Jan 2023)"
                        className="w-1/2 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={exp.end}
                        onChange={(e) => {
                          const list = [...formData.experience];
                          list[idx].end = e.target.value;
                          setFormData({ ...formData, experience: list });
                        }}
                        placeholder="End (Present)"
                        className="w-1/2 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Bullets */}
                  <div className="space-y-1.5 mt-2">
                    {exp.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">•</span>
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const list = [...formData.experience];
                            list[idx].bullets[bIdx] = e.target.value;
                            setFormData({ ...formData, experience: list });
                          }}
                          placeholder="Action-verb achievement (e.g. Spearheaded API rewrite improving throughput by 40%)..."
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            const list = [...formData.experience];
                            list[idx].bullets = list[idx].bullets.filter((_, i) => i !== bIdx);
                            setFormData({ ...formData, experience: list });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const list = [...formData.experience];
                        list[idx].bullets.push("");
                        setFormData({ ...formData, experience: list });
                      }}
                      className="text-[11px] text-indigo-600 font-bold hover:underline"
                    >
                      + Add Responsibility Bullet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Extras & Generate */}
        {currentStep === 7 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Certifications, Honors & Context</h2>
              <p className="text-xs text-slate-500">Provide truthful honors or certifications to format into your resume.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Certifications (one per line)</label>
              <textarea
                rows={3}
                value={formData.certifications.join('\n')}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value.split('\n').filter(Boolean) })}
                placeholder="AWS Certified Solutions Architect&#10;Meta React Developer Professional Certificate"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Key Achievements / Awards (one per line)</label>
              <textarea
                rows={3}
                value={formData.achievements.join('\n')}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value.split('\n').filter(Boolean) })}
                placeholder="1st Place at National Hackathon 2023&#10;Dean's List (2020-2024)"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Anything else the AI should know?</label>
              <textarea
                rows={3}
                value={formData.free_text}
                onChange={(e) => setFormData({ ...formData, free_text: e.target.value })}
                placeholder="Special domain interests, preferred focus areas..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Feedback Banner */}
      {errorMsg && (
        <div className="mb-4 p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-sm font-semibold flex items-center justify-between animate-in fade-in">
          <span>{errorMsg}</span>
          <button 
            type="button" 
            onClick={() => setErrorMsg('')}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        {currentStep < 7 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.min(7, s + 1))}
            className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center space-x-2 px-8 py-3 bg-slate-950 hover:bg-slate-800 text-white text-sm font-extrabold rounded-2xl shadow-xl shadow-slate-200 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> : <FileCheck2 className="w-5 h-5" />}
            <span>{loading ? 'Synthesizing Resume...' : 'Synthesize & Build Resume'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
