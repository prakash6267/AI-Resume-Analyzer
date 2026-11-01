import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkHealth, getTemplates, getResumeSuggestions } from '../api/client';

const initialResume = {
  target_role: "Full Stack Developer",
  personal: {
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: ""
  },
  summary: "",
  skills: [
    { category: "Languages & Frameworks", items: [] },
    { category: "Tools & Platforms", items: [] }
  ],
  education: [
    { degree: "", institution: "", start_year: "", end_year: "", score: "", cgpa_scale: "/10.0", details: "", coursework: [] }
  ],
  experience: [
    { title: "", company: "", location: "", start: "", end: "", bullets: [""] }
  ],
  projects: [
    { name: "", tech: [], link: "", bullets: [""] }
  ],
  certifications: [],
  achievements: [],
  missing_fields: []
};

const ResumeContext = createContext();

export const ResumeProvider = ({ children }) => {
  const [aiReady, setAiReady] = useState(true);
  const [resume, setResume] = useState(initialResume);
  const [activeTemplate, setActiveTemplate] = useState('classic');
  const [templates, setTemplates] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // ATS State
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [atsReport, setAtsReport] = useState(null);
  const [enhancedResult, setEnhancedResult] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Initial backend health check & template fetch
  useEffect(() => {
    checkHealth()
      .then((res) => {
        setAiReady(Boolean(res.ai_ready));
      })
      .catch((err) => {
        console.error("Health check error:", err);
        setAiReady(false);
      });

    getTemplates()
      .then((data) => setTemplates(data))
      .catch((err) => console.error("Failed to fetch templates:", err));
  }, []);

  const updatePersonalInfo = (field, value) => {
    setResume((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
  };

  const updateSummary = (value) => {
    setResume((prev) => ({ ...prev, summary: value }));
  };

  const updateTargetRole = (value) => {
    setResume((prev) => ({ ...prev, target_role: value }));
  };

  const resetResume = () => {
    setResume(initialResume);
    setAtsReport(null);
    setEnhancedResult(null);
    setSuggestions([]);
  };

  return (
    <ResumeContext.Provider
      value={{
        aiReady,
        resume,
        setResume,
        updatePersonalInfo,
        updateSummary,
        updateTargetRole,
        resetResume,
        activeTemplate,
        setActiveTemplate,
        templates,
        suggestions,
        setSuggestions,
        targetRole,
        setTargetRole,
        jobDescription,
        setJobDescription,
        atsReport,
        setAtsReport,
        enhancedResult,
        setEnhancedResult,
        uploadedFileName,
        setUploadedFileName
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
