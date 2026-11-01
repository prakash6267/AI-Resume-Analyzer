import React, { useState } from 'react';
import { Edit3, Eye, Database, CheckCircle2, Loader2 } from 'lucide-react';
import SectionEditor from '../components/SectionEditor';
import SuggestionsPanel from '../components/SuggestionsPanel';
import LiveResumePreview from '../components/LiveResumePreview';
import { useResume } from '../state/ResumeContext';
import { useAuth } from '../state/AuthContext';
import { saveUserResume } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function ReviewEdit() {
  const navigate = useNavigate();
  const { resume, targetRole, activeTemplate } = useResume();
  const { isAuthenticated } = useAuth();

  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveToDatabase = async () => {
    if (!isAuthenticated) {
      if (window.confirm('Please sign in or create an account to persist your resumes in the MySQL database. Proceed to login?')) {
        navigate('/login', { state: { from: { pathname: '/review' } } });
      }
      return;
    }

    setSaving(true);
    setSavedSuccess(false);
    try {
      await saveUserResume({
        title: `${resume.personal?.full_name || 'My'} - ${targetRole || resume.target_role || 'Resume'}`,
        target_role: targetRole || resume.target_role,
        template_id: activeTemplate || 'classic',
        ats_score: 85,
        resume: resume
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save resume:', err);
      alert('Could not save resume to database. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {resume.personal?.full_name ? `${resume.personal.full_name}'s Resume` : 'Review & Customize'}
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              ATS Single-Column
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Targeting: <strong className="text-indigo-600 font-semibold">{resume.target_role || 'General Role'}</strong>. Edit cards on the left; preview updates instantly on the right.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Save to MySQL Database Button */}
          <button
            type="button"
            onClick={handleSaveToDatabase}
            disabled={saving}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
            ) : savedSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            ) : (
              <Database className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>{savedSuccess ? 'Saved in MySQL!' : 'Save to Database'}</span>
          </button>

          {/* Mobile View Toggle */}
          <div className="flex lg:hidden bg-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setMobileTab('editor')}
              className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mobileTab === 'editor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mobileTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Suggestions Panel + Editable Section Cards */}
        <div className={`lg:col-span-6 xl:col-span-6 space-y-6 ${mobileTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
          <SuggestionsPanel />
          <SectionEditor />
        </div>

        {/* Right Column: Live A4 Preview & PDF Renderer */}
        <div className={`lg:col-span-6 xl:col-span-6 ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          <LiveResumePreview />
        </div>
      </div>
    </div>
  );
}
