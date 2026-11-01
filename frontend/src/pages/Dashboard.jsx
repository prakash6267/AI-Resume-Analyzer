import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Download, Trash2, Edit3, CheckCircle2, 
  Clock, ShieldCheck, Database, ArrowRight, Loader2, Sparkles 
} from 'lucide-react';
import { getMySavedResumes, deleteSavedResume, downloadResumePdf } from '../api/client';
import { useAuth } from '../state/AuthContext';
import { useResume } from '../state/ResumeContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setResume, setTargetRole } = useResume();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await getMySavedResumes();
      setResumes(res.resumes || []);
    } catch (err) {
      console.error('Error fetching resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResume = (item) => {
    if (item.resume) {
      setResume(item.resume);
      if (item.target_role) setTargetRole(item.target_role);
      navigate('/review');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved resume from the database?')) return;
    
    setDeletingId(id);
    try {
      await deleteSavedResume(id);
      setResumes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete resume.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (item, e) => {
    e.stopPropagation();
    setDownloadingId(item.id);
    try {
      await downloadResumePdf(item.resume, item.template_id || 'classic');
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Resumes & Documents
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center space-x-1">
              <Database className="w-3 h-3" />
              <span>Database Synced</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome back, <strong>{user?.full_name || user?.email}</strong>. Manage your stored profiles and export ATS-ready files.
          </p>
        </div>

        <div className="flex space-x-3">
          <Link
            to="/builder"
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Resume</span>
          </Link>
          <Link
            to="/ats"
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-slate-200 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Audit File</span>
          </Link>
        </div>
      </div>

      {/* Resumes Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading your database records...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No saved resumes found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't saved any resumes to the database yet. Create a resume with our step-by-step wizard or audit an existing PDF.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/builder"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Start Resume Builder</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenResume(item)}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <FileText className="w-5 h-5 text-slate-700 group-hover:text-indigo-600" />
                  </div>
                  {item.ats_score > 0 && (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold">
                      {item.ats_score} / 100 ATS
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {item.title || 'Untitled Resume'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  Target: <strong>{item.target_role || 'General Role'}</strong>
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {new Date(item.updated_at || item.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenResume(item);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Open & Edit</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={downloadingId === item.id}
                    onClick={(e) => handleDownload(item, e)}
                    title="Download PDF"
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {downloadingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={(e) => handleDelete(item.id, e)}
                    title="Delete Resume"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
