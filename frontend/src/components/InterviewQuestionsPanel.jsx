import React, { useState } from 'react';
import { 
  HelpCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle2, 
  Lightbulb, Target, Layers, Briefcase, Award 
} from 'lucide-react';

export default function InterviewQuestionsPanel({ questions = [], targetRole = '' }) {
  const [expandedId, setExpandedId] = useState(questions?.[0]?.id || null);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
        No interview questions generated yet. Enhance your resume or audit a file to generate questions.
      </div>
    );
  }

  const categoryColor = (cat = '') => {
    const c = cat.toLowerCase();
    if (c.includes('tech') || c.includes('code')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (c.includes('project') || c.includes('arch')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (c.includes('behav') || c.includes('lead')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-sky-50 text-sky-700 border-sky-200';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span>Tailored Interview Questions ({questions.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Role: <strong>{targetRole || 'Engineering'}</strong> &bull; Grounded in your exact resume projects and technical claims
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const isExpanded = expandedId === (q.id || idx);
          return (
            <div
              key={q.id || idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : (q.id || idx))}
                className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${categoryColor(q.category)}`}>
                      {q.category || 'Technical'}
                    </span>
                    {q.context_from_resume && (
                      <span className="text-[11px] text-slate-400 truncate max-w-xs">
                        From: {q.context_from_resume}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {idx + 1}. {q.question}
                  </h4>
                </div>

                <div className="p-1 text-slate-400 shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                  {/* What interviewer looks for */}
                  {q.what_interviewer_looks_for && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <div className="flex items-center space-x-1.5 text-indigo-700 font-bold text-[11px] mb-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>What Interviewers Look For:</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{q.what_interviewer_looks_for}</p>
                    </div>
                  )}

                  {/* Suggested Answer Framework */}
                  {q.suggested_answer_framework && (
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                      <div className="flex items-center space-x-1.5 text-indigo-900 font-bold text-[11px] mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Suggested STAR Answer Strategy:</span>
                      </div>
                      <p className="text-indigo-950 font-medium leading-relaxed whitespace-pre-wrap">{q.suggested_answer_framework}</p>
                    </div>
                  )}

                  {/* Key points to mention */}
                  {q.expected_key_points && q.expected_key_points.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Key Points to Emphasize:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {q.expected_key_points.map((pt, pIdx) => (
                          <span key={pIdx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{pt}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
