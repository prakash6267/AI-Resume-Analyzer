import React, { useState } from 'react';
import { 
  Lightbulb, AlertCircle, AlertTriangle, Info, Check, 
  X, ArrowRight, RefreshCw, Loader2, Sparkles 
} from 'lucide-react';
import { getResumeSuggestions } from '../api/client';
import { useResume } from '../state/ResumeContext';

export default function SuggestionsPanel() {
  const { resume, setResume, targetRole, jobDescription, suggestions, setSuggestions } = useResume();
  const [inputValues, setInputValues] = useState({});
  const [skippedState, setSkippedState] = useState({});
  const [loading, setLoading] = useState(false);
  const [appliedFeedback, setAppliedFeedback] = useState({});

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await getResumeSuggestions(resume, targetRole, jobDescription);
      setSuggestions(res.suggestions || []);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (suggestion) => {
    const userInput = inputValues[suggestion.id] || suggestion.suggested_value;
    
    // Apply changes to resume state based on suggestion.field_to_fill or section
    setResume((prev) => {
      const updated = { ...prev };
      const f = suggestion.field_to_fill?.toLowerCase();

      if (f === 'cgpa_scale' && updated.education?.length > 0) {
        updated.education[0].cgpa_scale = userInput || '/10.0';
      } else if (f === 'summary' && userInput) {
        updated.summary = userInput;
      } else if (f === 'coursework' && userInput && updated.education?.length > 0) {
        const items = userInput.split(',').map(s => s.trim()).filter(Boolean);
        updated.education[0].coursework = [...(updated.education[0].coursework || []), ...items];
      } else if (f === 'linkedin' && userInput) {
        updated.personal.linkedin = userInput;
      } else if (f === 'github' && userInput) {
        updated.personal.github = userInput;
      } else if (f === 'portfolio' && userInput) {
        updated.personal.portfolio = userInput;
      } else if (f === 'skills' && userInput) {
        // Add skill to first category or new category
        if (updated.skills?.length > 0) {
          if (!updated.skills[0].items.includes(userInput.trim())) {
            updated.skills[0].items.push(userInput.trim());
          }
        } else {
          updated.skills = [{ category: "Skills", items: [userInput.trim()] }];
        }
      }
      return updated;
    });

    setAppliedFeedback(prev => ({ ...prev, [suggestion.id]: 'Applied!' }));
    setTimeout(() => {
      // Remove applied suggestion
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }, 800);
  };

  const handleDismiss = (sId) => {
    setSuggestions(prev => prev.filter(s => s.id !== sId));
  };

  const handleSkip = (sId) => {
    setSkippedState(prev => ({ ...prev, [sId]: true }));
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-sm flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950">No High-Priority Suggestions</h4>
            <p className="text-xs text-emerald-700 mt-0.5">Your resume adheres cleanly to ATS structural best practices.</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100/50 rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Check Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">AI & ATS Improvement Suggestions ({suggestions.length})</h3>
            <p className="text-xs text-slate-500">Actionable recommendations to enhance recruiter scanability</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Analyze</span>
        </button>
      </div>

      <div className="space-y-3.5">
        {suggestions.map((s) => {
          const isHigh = s.severity?.toLowerCase() === 'high';
          const isMed = s.severity?.toLowerCase() === 'medium';
          const isSkipped = skippedState[s.id];
          const isApplied = appliedFeedback[s.id];

          return (
            <div
              key={s.id}
              className={`p-4 rounded-2xl border transition-all ${
                isApplied
                  ? 'bg-emerald-50 border-emerald-300'
                  : isHigh
                  ? 'bg-rose-50/60 border-rose-200'
                  : isMed
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-sky-50/60 border-sky-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                      isHigh
                        ? 'bg-rose-100 text-rose-800'
                        : isMed
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {s.severity} Severity
                  </span>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {s.section}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleDismiss(s.id)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Suggestion Text */}
              <p className="text-sm font-bold text-slate-900 mb-1">
                {s.suggestion}
              </p>

              {/* Why it helps */}
              <p className="text-xs text-slate-600 mb-3 flex items-start space-x-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>Why this helps:</strong> {s.why_it_helps}</span>
              </p>

              {/* Skipped Message */}
              {isSkipped ? (
                <div className="p-2.5 bg-amber-100/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                  <span>
                    <strong>Skipped:</strong> Adding real metrics and details gives ATS parsers and technical interviewers clear proof of impact.
                  </span>
                  <button
                    onClick={() => setSkippedState(prev => ({ ...prev, [s.id]: false }))}
                    className="font-bold underline text-amber-950 ml-2"
                  >
                    Undo
                  </button>
                </div>
              ) : s.needs_user_input ? (
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <input
                    type="text"
                    value={inputValues[s.id] || ''}
                    onChange={(e) => setInputValues({ ...inputValues, [s.id]: e.target.value })}
                    placeholder={s.suggested_value ? `e.g. ${s.suggested_value}` : "Enter value to apply..."}
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => handleApply(s)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      {isApplied ? 'Applied!' : 'Apply'}
                    </button>
                    <button
                      onClick={() => handleSkip(s.id)}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl border border-slate-200 transition-all"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => handleSkip(s.id)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:bg-white rounded-lg border border-slate-200"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => handleApply(s)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    {isApplied ? 'Applied!' : 'Acknowledge & Mark Done'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
