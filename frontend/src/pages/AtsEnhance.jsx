import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, CheckCircle2, ArrowRight, ArrowLeft, 
  Download, Edit3, History, Database, FileCheck2, Loader2,
  HelpCircle, Sparkles, MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import LiveResumePreview from '../components/LiveResumePreview';
import InterviewQuestionsPanel from '../components/InterviewQuestionsPanel';
import { useResume } from '../state/ResumeContext';
import { useAuth } from '../state/AuthContext';
import { saveUserResume } from '../api/client';

export default function AtsEnhance() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { enhancedResult, resume, setResume, activeTemplate, targetRole } = useResume();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('changelog'); // 'changelog' | 'questions'

  useEffect(() => {
    if (enhancedResult?.new_score && enhancedResult.new_score >= 80) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    if (enhancedResult?.improved_resume) {
      setResume(enhancedResult.improved_resume);
    }
  }, [enhancedResult, setResume]);

  if (!enhancedResult) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <FileCheck2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">No Enhancement Data</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">Run the ATS Audit Engine first to generate recommendations.</p>
        <Link
          to="/ats"
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to ATS Audit</span>
        </Link>
      </div>
    );
  }

  const scoreGain = enhancedResult.new_score - enhancedResult.old_score;

  const handleSaveToDatabase = async () => {
    if (!isAuthenticated) {
      if (window.confirm('Sign in to persist your improved resume to the MySQL database. Proceed to login?')) {
        navigate('/login', { state: { from: { pathname: '/ats/enhance' } } });
      }
      return;
    }

    setSaving(true);
    setSavedSuccess(false);
    try {
      await saveUserResume({
        title: `${resume.personal?.full_name || 'Enhanced'} - ${targetRole || resume.target_role || 'Resume'} (ATS ${enhancedResult.new_score})`,
        target_role: targetRole || resume.target_role,
        template_id: activeTemplate || 'classic',
        ats_score: enhancedResult.new_score,
        resume: resume
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save to database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Before / After Hero Banner */}
      <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 mb-3">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ATS Optimization Applied</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Optimization Summary & Score Increase
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Active verbs upgraded, quantified metrics integrated, and formatting aligned with single-column ATS specifications.
            </p>
          </div>

          {/* Score comparison pill */}
          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/15">
            <div className="text-center">
              <span className="block text-[11px] text-slate-400 font-bold uppercase">Original</span>
              <span className="text-2xl font-extrabold text-slate-300">{enhancedResult.old_score}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <div className="text-center">
              <span className="block text-[11px] text-emerald-400 font-bold uppercase">Enhanced</span>
              <span className="text-3xl font-extrabold text-emerald-400">{enhancedResult.new_score}</span>
            </div>
            {scoreGain > 0 && (
              <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold rounded-lg">
                +{scoreGain} pts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Changes on Left, Live Preview on Right */}
      {/* Main Split Layout: Changes / Interview Questions on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tabbed View for Changelog & Interview Questions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            {/* Tab Header & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('changelog')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'changelog'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Changelog ({enhancedResult.changes?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'questions'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Interview Prep ({enhancedResult.interview_questions?.length || 0})</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSaveToDatabase}
                  disabled={saving}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    savedSuccess
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5" />
                  )}
                  <span>{savedSuccess ? 'Saved in MySQL!' : 'Save to DB'}</span>
                </button>

                <Link
                  to="/review"
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Manual Edit</span>
                </Link>
              </div>
            </div>

            {/* Tab 1: Changelog */}
            {activeTab === 'changelog' && (
              <div className="space-y-4">
                {enhancedResult.changes?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Formatting standardized across all sections.</p>
                ) : (
                  enhancedResult.changes?.map((change, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                          {change.section}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">{change.reason}</span>
                      </div>

                      {change.before && (
                        <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900 line-through">
                          <span className="font-bold text-rose-700 block text-[10px] uppercase">Before:</span>
                          {change.before}
                        </div>
                      )}

                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium">
                        <span className="font-bold text-emerald-700 block text-[10px] uppercase">After (Enhanced):</span>
                        {change.after}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Interview Questions */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-bold text-indigo-950">
                      Practice these role-specific questions generated directly from your enhanced resume.
                    </span>
                  </div>
                  <Link
                    to="/interview-room"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shrink-0 transition-colors inline-flex items-center space-x-1"
                  >
                    <span>Launch AI Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <InterviewQuestionsPanel 
                  questions={enhancedResult.interview_questions || []}
                  targetRole={targetRole || resume?.target_role}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live A4 Preview & PDF Renderer */}
        <div className="lg:col-span-6">
          <LiveResumePreview />
        </div>
      </div>
    </div>
  );
}
