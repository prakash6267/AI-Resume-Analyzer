import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ChevronRight, Wrench } from 'lucide-react';

export default function IssueList({ issues = [] }) {
  const [filter, setFilter] = useState('all');

  const filteredIssues = issues.filter((iss) => {
    if (filter === 'all') return true;
    return iss.severity?.toLowerCase() === filter;
  });

  const highCount = issues.filter((i) => i.severity?.toLowerCase() === 'high').length;
  const mediumCount = issues.filter((i) => i.severity?.toLowerCase() === 'medium').length;
  const lowCount = issues.filter((i) => i.severity?.toLowerCase() === 'low').length;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">ATS Issues & Recommendations</h3>
          <p className="text-xs text-slate-500">Prioritized checklist to optimize ATS pass-rate</p>
        </div>
        
        {/* Severity Filter Pills */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({issues.length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'high'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            High ({highCount})
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'medium'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Medium ({mediumCount})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filter === 'low'
                ? 'bg-sky-600 text-white'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            Low ({lowCount})
          </button>
        </div>
      </div>

      {/* Issues list */}
      <div className="mt-4 space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No issues found in this category!</p>
          </div>
        ) : (
          filteredIssues.map((issue, idx) => {
            const isHigh = issue.severity?.toLowerCase() === 'high';
            const isMed = issue.severity?.toLowerCase() === 'medium';

            return (
              <div
                key={issue.id || idx}
                className={`p-4 rounded-xl border transition-all ${
                  isHigh
                    ? 'bg-rose-50/50 border-rose-200'
                    : isMed
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-sky-50/50 border-sky-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    {isHigh ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : isMed ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-sky-600 shrink-0" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {issue.section}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      isHigh
                        ? 'bg-rose-100 text-rose-800'
                        : isMed
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {issue.severity} Priority
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-800 mb-2">
                  {issue.problem}
                </p>

                <div className="flex items-start space-x-2 text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-200/60">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Recommended Fix: </span>
                    <span>{issue.fix}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
