import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, MapPin, Building, Clock, Search, Plus, 
  ArrowRight, Users, CheckCircle2, ShieldCheck, Loader2, X 
} from 'lucide-react';
import { getJobsList, createCompanyJob, applyToJob } from '../api/client';
import { useAuth } from '../state/AuthContext';
import { useResume } from '../state/ResumeContext';

export default function JobBoard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { resume } = useResume();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Post Job Modal State
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    company_name: user?.company_name || 'TechCorp',
    department: 'Engineering',
    location: 'Remote / Hybrid',
    experience_level: '2-5 years',
    job_description: '',
    required_skills: '',
    min_ats_cutoff: 70
  });

  // Apply Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const [candidateName, setCandidateName] = useState(user?.full_name || resume.personal?.full_name || '');
  const [candidateEmail, setCandidateEmail] = useState(user?.email || resume.personal?.email || '');
  const [candidatePhone, setCandidatePhone] = useState(resume.personal?.phone || '');
  const [coverNote, setCoverNote] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await getJobsList();
      setJobs(res.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.job_description) {
      alert('Please fill in job title and job description.');
      return;
    }

    setPosting(true);
    try {
      const skillsArray = jobForm.required_skills.split(',').map(s => s.trim()).filter(Boolean);
      await createCompanyJob({
        ...jobForm,
        required_skills: skillsArray
      });
      setPostModalOpen(false);
      setJobForm({
        title: '',
        company_name: 'TechCorp',
        department: 'Engineering',
        location: 'Remote / Hybrid',
        experience_level: '2-5 years',
        job_description: '',
        required_skills: '',
        min_ats_cutoff: 70
      });
      await fetchJobs();
    } catch (err) {
      console.error('Failed to post job:', err);
      alert('Error creating job posting.');
    } finally {
      setPosting(false);
    }
  };

  const handleOpenApply = (job) => {
    setSelectedJob(job);
    setApplyResult(null);
    setCandidateName(user?.full_name || resume.personal?.full_name || '');
    setCandidateEmail(user?.email || resume.personal?.email || '');
    setCandidatePhone(resume.personal?.phone || '');
    setApplyModalOpen(true);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    setApplying(true);
    try {
      const res = await applyToJob(selectedJob.id, {
        candidate_name: candidateName || 'Candidate',
        candidate_email: candidateEmail || 'candidate@example.com',
        candidate_phone: candidatePhone,
        cover_note: coverNote,
        resume: resume
      });
      setApplyResult(res);
    } catch (err) {
      console.error('Application error:', err);
      alert(err.response?.data?.detail || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.required_skills && j.required_skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Company Jobs & Recruiter ATS Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse corporate openings, 1-click apply with automated ATS scoring, or post openings with custom interview cutoffs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPostModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job Opening</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search jobs by title, company, skills (e.g. Python, React, DevOps)..."
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
        />
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-xs text-slate-500 font-medium">Fetching job openings from database...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-xs text-slate-500">No jobs match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-xl transition-colors">
                    <Building className="w-5 h-5 text-slate-700 group-hover:text-indigo-600" />
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase">
                    ATS Cutoff: {job.min_ats_cutoff} pts
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {job.title}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">{job.company_name}</p>

                <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-2 mb-3">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{job.location}</span>
                  </span>
                  <span>&bull;</span>
                  <span>{job.experience_level}</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {job.job_description}
                </p>

                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.required_skills.slice(0, 4).map((sk, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                        {sk}
                      </span>
                    ))}
                    {job.required_skills.length > 4 && (
                      <span className="px-1.5 py-0.5 text-slate-400 text-[10px] font-bold">
                        +{job.required_skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  to={`/jobs/${job.id}/applicants`}
                  className="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center space-x-1"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Applicants ({job.total_applicants})</span>
                </Link>

                <button
                  onClick={() => handleOpenApply(job)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center space-x-1"
                >
                  <span>1-Click Apply</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Job Modal */}
      {postModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Post New Company Opening</h3>
              <button onClick={() => setPostModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={jobForm.company_name}
                    onChange={(e) => setJobForm({ ...jobForm, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={jobForm.department}
                    onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ATS Cutoff (/100)</label>
                  <input
                    type="number"
                    min="40"
                    max="95"
                    value={jobForm.min_ats_cutoff}
                    onChange={(e) => setJobForm({ ...jobForm, min_ats_cutoff: parseInt(e.target.value) || 70 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Technical Skills (comma separated)</label>
                <input
                  type="text"
                  value={jobForm.required_skills}
                  onChange={(e) => setJobForm({ ...jobForm, required_skills: e.target.value })}
                  placeholder="e.g. Python, FastAPI, Docker, PostgreSQL, React"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Description & Responsibilities *</label>
                <textarea
                  rows={4}
                  required
                  value={jobForm.job_description}
                  onChange={(e) => setJobForm({ ...jobForm, job_description: e.target.value })}
                  placeholder="Paste detailed job requirements and expectations..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPostModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow"
                >
                  {posting ? 'Publishing...' : 'Publish Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1-Click Apply Modal */}
      {applyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Apply for {selectedJob.title}</h3>
                <p className="text-[11px] text-slate-500">{selectedJob.company_name} &bull; Min Cutoff: {selectedJob.min_ats_cutoff} pts</p>
              </div>
              <button onClick={() => setApplyModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {applyResult ? (
              <div className="space-y-4 text-center py-4 animate-in fade-in">
                <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                  applyResult.is_shortlisted ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  {applyResult.is_shortlisted ? 'Application Shortlisted!' : 'Application Submitted'}
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <p>Your ATS Match Score: <strong>{applyResult.ats_score} / 100</strong></p>
                  <p className="text-slate-500">Status: <strong className="uppercase text-indigo-600">{applyResult.status}</strong></p>
                </div>
                <p className="text-xs text-slate-500">
                  {applyResult.is_shortlisted
                    ? 'Congratulations! You met the minimum cutoff score. The recruiter has been notified to schedule your interview.'
                    : 'Your application has been received and added to the applicant pool for recruiter review.'}
                </p>
                <button
                  onClick={() => setApplyModalOpen(false)}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cover Note (Optional)</label>
                  <textarea
                    rows={2}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Briefly state why you're a great fit..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                  <span>Applying with your current active resume: <strong>{resume.personal?.full_name || 'Resume Draft'}</strong>.</span>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow flex items-center space-x-1.5"
                  >
                    {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{applying ? 'Scoring & Applying...' : 'Submit Application'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
