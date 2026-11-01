import React from 'react';

export default function ScoreGauge({ score = 0, size = 180, strokeWidth = 14, showSubtext = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const offset = circumference - (progress / 100) * circumference;

  const getColor = (val) => {
    if (val >= 80) return { stroke: '#10b981', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800', label: 'Excellent Match' };
    if (val >= 65) return { stroke: '#6366f1', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-800', label: 'Good Potential' };
    if (val >= 50) return { stroke: '#f59e0b', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800', label: 'Needs Improvement' };
    return { stroke: '#ef4444', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-800', label: 'Critical ATS Issues' };
  };

  const currentTheme = getColor(progress);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={currentTheme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold tracking-tight ${currentTheme.text}`}>
            {progress}
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            out of 100
          </span>
        </div>
      </div>

      {showSubtext && (
        <div className="mt-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${currentTheme.badge}`}>
            {currentTheme.label}
          </span>
          <p className="text-xs text-slate-500 mt-1">
            Estimated ATS Score
          </p>
        </div>
      )}
    </div>
  );
}
