import React from 'react';

export default function BrandLogo({ size = 'md', showText = true, light = false }) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeMap = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className="flex items-center space-x-2.5 select-none group">
      {/* Bespoke Geometric Executive Vector Logo */}
      <div className={`relative ${sizeMap[size] || sizeMap.md} shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900 p-2 text-white shadow-md shadow-slate-900/10 border border-slate-700/30 group-hover:scale-105 transition-transform duration-200`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-indigo-400"
        >
          {/* Document Base Crest */}
          <path
            d="M6 3.75C6 2.7835 6.7835 2 7.75 2H14.25L19 6.75V20.25C19 21.2165 18.2165 22 17.25 22H7.75C6.7835 22 6 21.2165 6 20.25V3.75Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Fold Corner */}
          <path
            d="M14 2V7H19"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Precision Alignment Bars */}
          <path
            d="M9.5 11H15.5"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M9.5 14.5H15.5"
            stroke="#818cf8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M9.5 18H13"
            stroke="#34d399"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className={`font-black tracking-tight ${textSizeMap[size] || textSizeMap.md} ${light ? 'text-white' : 'text-slate-900'}`}>
              ProResume<span className="text-indigo-600">ATS</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              PRO
            </span>
          </div>
          <span className={`text-[10px] font-medium tracking-wide ${light ? 'text-slate-400' : 'text-slate-500'} -mt-1 hidden sm:block`}>
            Resume & ATS Analyzer
          </span>
        </div>
      )}
    </div>
  );
}
