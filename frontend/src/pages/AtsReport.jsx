import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, 
  Tag, TrendingUp, Loader2, Info, Check, Eye, Plus, Database, FileCheck2 
} from 'lucide-react';
import ScoreGauge from '../components/ScoreGauge';
import IssueList from '../components/IssueList';
import { enhanceResume, saveAtsHistoryRecord } from '../api/client';
import { useResume } from '../state/ResumeContext';
import { useAuth } from '../state/AuthContext';

export default function AtsReport() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    resume, setResume, atsReport, setEnhancedResult, 
    targetRole, jobDescription, uploadedFileName 
  } = useResume();

  const [answers, setAnswers] = useState({});
  const [skippedQuestions, setSkippedQuestions] = useState({});
  const [addedKeywords, setAddedKeywords] = useState({});
  const [enhancing, setEnhancing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedHistory, setSavedHistory] = useState(false);

  if (!atsReport) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">No ATS Audit Available</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Upload your resume first or construct one in the Resume Studio.
        </p>
        <Link
          to="/ats"
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload Resume</span>
        </Link>
      </div>
    );
  }

  const handleAnswerChange = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSkipQuestion = (qId) => {
    setSkippedQuestions(prev => ({ ...prev, [qId]: true }));
  };

  const handleAddKeywordToSkills = (kw) => {
    if (!kw) return;
    setResume(prev => {
      const updated = { ...prev };
      if (updated.skills && updated.skills.length > 0) {
        if (!updated.skills[0].items.includes(kw)) {
          updated.skills[0].items.push(kw);
        }
      } else {
        updated.skills = [{ category: "Technical Skills", items: [kw] }];
      }
      return updated;
    });
    setAddedKeywords(prev => ({ ...prev, [kw]: true }));
  };

  const handleSaveToHistory = async () => {
    if (!isAuthenticated) {
      if (window.confirm('Sign in to store audit reports in your MySQL database history. Proceed to login?')) {
        navigate('/login', { state: { from: { pathname: '/ats/report' } } });
      }
      return;
    }

    try {
      await saveAtsHistoryRecord({
        filename: uploadedFileName || 'resume.pdf',
        target_role: targetRole || resume.target_role || 'General',
        score: atsReport.score,
        report: atsReport
      });
      setSavedHistory(true);
      setTimeout(() => setSavedHistory(false), 3000);
    } catch (err) {
      console.error('History save error:', err);
    }
  };

  const handleEnhance = async () => {
    setEnhancing(true);
    setErrorMsg('');

    const userAnswersPayload = atsReport.questions
      ?.filter(q => answers[q.id] && !skippedQuestions[q.id])
      .map(q => ({
        question_id: q.id,
        field: q.field,
        answer: answers[q.id]
      })) || [];

    try {
      const enhancedResponse = await enhanceResume({
        resume,
        report: atsReport,
        target_role: targetRole || resume.target_role,
        job_description: jobDescription,
        user_answers: userAnswersPayload
      });

      setEnhancedResult(enhancedResponse);
      navigate('/ats/enhance');
    } catch (err) {
      console.error("Enhancement error:", err);
      const detail = err.response?.data?.detail || "Enhancement service busy, please try again.";
      setErrorMsg(detail);
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ATS Audit & Rubric Breakdown
            </h1>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-xs font-bold">
              100-Pt Matrix
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Candidate: <strong>{resume.personal?.full_name || 'Candidate'}</strong> • Role: <strong className="text-indigo-600">{targetRole || resume.target_role || 'General'}</strong>
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSaveToHistory}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all border ${
              savedHistory
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{savedHistory ? 'Stored in DB!' : 'Save Audit to DB'}</span>
          </button>

          <Link
            to="/review"
            className="flex items-center space-x-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Current Draft</span>
          </Link>

          <button
            onClick={handleEnhance}
            disabled={enhancing}
            className="flex items-center space-x-2 px-6 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-slate-200 transition-all disabled:opacity-50"
          >
            {enhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
            <span>{enhancing ? 'Optimizing Phrasing...' : 'Enhance Resume'}</span>
          </button>
        </div>
      </div>

      {/* Top Grid: Score Gauge + Rubric Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Score Gauge Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <ScoreGauge score={atsReport.score} size={200} />
          
          <div className="w-full mt-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800 mb-1">ATS Parser Parsability</p>
            Measures structural extractability, metric clarity, role keyword density, and single-column formatting.
          </div>
        </div>

        {/* 8-Category Rubric Breakdown Progress Bars */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">Rubric Category Breakdown</h3>
            <div className="space-y-3.5">
              {atsReport.breakdown?.map((cat, idx) => {
                const pct = Math.round((cat.score / cat.max) * 100);
                const isGood = pct >= 75;
                const isMed = pct >= 50 && pct < 75;

                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-700">{cat.category}</span>
                      <span className="font-bold text-slate-900">
                        {cat.score} / {cat.max} pts
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${
                          isGood ? 'bg-emerald-500' : isMed ? 'bg-indigo-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {cat.notes && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{cat.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Keywords Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Keywords */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Matched Role Keywords ({atsReport.matched_keywords?.length || 0})</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {atsReport.matched_keywords?.map((kw, i) => (
              <span key={i} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg">
                ✓ {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Keywords with Interactive + Add Button */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">Missing Target Keywords ({atsReport.missing_keywords?.length || 0})</h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Click to add verified skills you possess into your profile skills section:
          </p>
          <div className="flex flex-wrap gap-2">
            {atsReport.missing_keywords?.map((kw, i) => {
              const isAdded = addedKeywords[kw];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddKeywordToSkills(kw)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    isAdded
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Added: {kw}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-rose-600" />
                      <span>{kw}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Missing Details Questionnaire */}
      {atsReport.questions && atsReport.questions.length > 0 && (
        <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Guided Metric Enrichment</h3>
              <p className="text-xs text-slate-500">
                Answer these targeted prompts to enrich bullet points with quantified outcomes.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {atsReport.questions.map((q) => {
              const isSkipped = skippedQuestions[q.id];

              return (
                <div key={q.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded uppercase">
                        {q.field}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{q.question}</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full">
                      +{q.est_gain || 5} pts
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-3 flex items-center space-x-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span><strong>Why it helps:</strong> {q.why_it_helps}</span>
                  </p>

                  {isSkipped ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <strong>Skipped:</strong> You can proceed without adding this detail.
                      <button
                        onClick={() => setSkippedQuestions(prev => ({ ...prev, [q.id]: false }))}
                        className="ml-2 font-bold underline text-amber-900"
                      >
                        Undo Skip
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Provide real metric or detail (e.g. reduced build time by 40%)..."
                        className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSkipQuestion(q.id)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleEnhance}
              disabled={enhancing}
              className="px-8 py-3 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {enhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
              <span>{enhancing ? 'Applying Enhancements...' : 'Apply Answers & Enhance Resume'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Prioritized Issues Checklist */}
      <IssueList issues={atsReport.issues || []} />
    </div>
  );
}
