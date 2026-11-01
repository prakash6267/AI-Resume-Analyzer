import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, ShieldCheck, ArrowRight, 
  FileText, Zap, Cpu, LayoutTemplate, Database,
  TrendingUp, FileCheck2, Award, HardDrive
} from 'lucide-react';
import { useAuth } from '../state/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold mb-6">
          <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Smart ATS Evaluation • Clean Resume Builder & Exporter</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-tight">
          AI Resume Builder & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600">Smart ATS Analyzer</span>
        </h1>
        
        <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Build structured resumes tailored to your target job roles or audit existing documents against an honest 100-point applicant tracking system rubric.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/builder"
            className="px-8 py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 flex items-center space-x-2.5 transition-all group"
          >
            <span>Launch Resume Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/ats"
            className="px-8 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold rounded-2xl shadow-sm flex items-center space-x-2 transition-all"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Audit Existing Resume</span>
          </Link>
        </div>
      </div>

      {/* Two Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Module 1: Resume Studio */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl shadow-slate-100/70 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-6">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-2">
              Studio • Role Targeting
            </div>
            <h3 className="text-2xl font-bold text-slate-950 mb-3">Structured Resume Studio</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Step-by-step career builder that helps you structure your work experience, education, skills, and projects into clean, ATS-friendly resume formats.
            </p>

            <ul className="space-y-3 mb-8 text-xs text-slate-600 font-medium">
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-step form with CGPA scale, coursework, and project links</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Structured layout: cleanly highlights your skills, education, and achievements</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Real-time A4 document preview with instant PDF rendering</span>
              </li>
            </ul>
          </div>

          <Link
            to="/builder"
            className="w-full py-3.5 px-6 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Start Building Resume</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Module 2: ATS Checker & Compliance */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl shadow-slate-100/70 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-2">
              Auditor • 100-Point Rubric
            </div>
            <h3 className="text-2xl font-bold text-slate-950 mb-3">100-Point ATS Audit Engine</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Upload existing PDF or DOCX documents to evaluate ATS parsability across 8 technical dimensions, discover missing industry keywords, and review before/after enhancements.
            </p>

            <ul className="space-y-3 mb-8 text-xs text-slate-600 font-medium">
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dual-engine rubric auditing keywords, metrics, verbs, and formatting</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Identifies missing technical keywords matching job descriptions</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Interactive metric enrichment questionnaire with clear diffs</span>
              </li>
            </ul>
          </div>

          <Link
            to="/ats"
            className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Audit & Scan Resume</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-slate-200">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">AI Resume Insights</h4>
          <p className="text-xs text-slate-500">Smart analysis of skills, experience, and keyword matches with job descriptions.</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
            <Database className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Database Storage</h4>
          <p className="text-xs text-slate-500">Secure user accounts, saved resumes, and previous audit history.</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl w-fit">
            <HardDrive className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Instant PDF Export</h4>
          <p className="text-xs text-slate-500">Download formatted, ATS-compliant single-column PDF resumes.</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl w-fit">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Secure Authentication</h4>
          <p className="text-xs text-slate-500">Protected user data with bcrypt hashing and JWT token authorization.</p>
        </div>
      </div>
    </div>
  );
}
