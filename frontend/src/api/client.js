import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 90000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('proresume_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Health & System Status ---
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getSystemStatus = async () => {
  const response = await api.get('/system/status');
  return response.data;
};

export const switchAIProvider = async (provider) => {
  const response = await api.post('/system/switch-provider', { provider });
  return response.data;
};

// --- Resumes AI Generation & Editing ---
export const generateResume = async (payload) => {
  const response = await api.post('/resume/generate', payload);
  return response.data;
};

export const refineResumeSection = async (payload) => {
  const response = await api.post('/resume/refine', payload);
  return response.data;
};

export const getResumeSuggestions = async (resume, targetRole = '', jobDescription = '') => {
  const response = await api.post('/resume/suggest', {
    resume,
    target_role: targetRole,
    job_description: jobDescription,
  });
  return response.data;
};

export const renderResumeHtml = async (resume, templateId = 'classic') => {
  const response = await api.post('/resume/render-html', {
    resume,
    template_id: templateId
  });
  return response.data;
};

export const downloadResumePdf = async (resume, templateId = 'classic') => {
  const response = await api.post('/resume/render-pdf', {
    resume,
    template_id: templateId
  }, {
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${resume?.personal?.full_name || 'Resume'}_${templateId}.pdf`.replace(/\s+/g, '_');
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// --- ATS Audit & Enhancer ---
export const uploadResumeFile = async (file, targetRole = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (targetRole) {
    formData.append('target_role', targetRole);
  }
  const response = await api.post('/ats/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const scoreResume = async (resume, targetRole = '', jobDescription = '') => {
  const response = await api.post('/ats/score', {
    resume,
    target_role: targetRole,
    job_description: jobDescription,
  });
  return response.data;
};

export const enhanceResume = async (payload) => {
  const response = await api.post('/ats/enhance', payload);
  return response.data;
};

export const getTemplates = async () => {
  const response = await api.get('/templates');
  return response.data;
};

// --- Database Resumes CRUD ---
export const getMySavedResumes = async () => {
  const response = await api.get('/resumes/my-resumes');
  return response.data;
};

export const saveUserResume = async (payload) => {
  const response = await api.post('/resumes/save', payload);
  return response.data;
};

export const getSavedResumeById = async (resumeId) => {
  const response = await api.get(`/resumes/${resumeId}`);
  return response.data;
};

export const deleteSavedResume = async (resumeId) => {
  const response = await api.delete(`/resumes/${resumeId}`);
  return response.data;
};

export const saveAtsHistoryRecord = async (payload) => {
  const response = await api.post('/resumes/history/save', payload);
  return response.data;
};

// --- Software & Database Backups ---
export const createDatabaseBackup = async () => {
  const response = await api.post('/backup/create');
  return response.data;
};

export const listDatabaseBackups = async () => {
  const response = await api.get('/backup/list');
  return response.data;
};

export const downloadDatabaseBackupFile = async (filename) => {
  const response = await api.get(`/backup/download/${filename}`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const restoreDatabaseBackup = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/backup/restore', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// --- Company Jobs & Applications Portal ---
export const getJobsList = async () => {
  const response = await api.get('/jobs');
  return response.data;
};

export const createCompanyJob = async (payload) => {
  const response = await api.post('/jobs', payload);
  return response.data;
};

export const getJobById = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
};

export const applyToJob = async (jobId, payload) => {
  const response = await api.post(`/jobs/${jobId}/apply`, payload);
  return response.data;
};

export const getJobApplicants = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}/applications`);
  return response.data;
};

// --- Interviews & Scheduling & AI Live Room ---
export const scheduleInterview = async (payload) => {
  const response = await api.post('/interviews/schedule', payload);
  return response.data;
};

export const getMyInterviews = async (email = '') => {
  const params = email ? { email } : {};
  const response = await api.get('/interviews/my-interviews', { params });
  return response.data;
};

export const getInterviewerQuestionSheet = async (applicationId) => {
  const response = await api.get(`/interviews/${applicationId}/questions`);
  return response.data;
};

export const conductAIInterviewTurn = async (payload) => {
  const response = await api.post('/interviews/ai-interview-turn', payload);
  return response.data;
};

export const finalizeAIInterviewReport = async (payload) => {
  const response = await api.post('/interviews/ai-final-evaluation', payload);
  return response.data;
};

// --- AI Chatbot & Email Dispatch ---
export const sendChatMessage = async (payload) => {
  const response = await api.post('/api/chat/message', payload);
  return response.data;
};

export const sendResumeEmail = async (payload) => {
  const response = await api.post('/api/email/send-resume', payload);
  return response.data;
};

export default api;
