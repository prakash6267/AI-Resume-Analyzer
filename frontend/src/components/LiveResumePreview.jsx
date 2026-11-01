import React, { useState, useEffect } from 'react';
import { Download, LayoutTemplate, ZoomIn, ZoomOut, RotateCcw, Loader2, Check, Mail } from 'lucide-react';
import { renderResumeHtml, downloadResumePdf } from '../api/client';
import { useResume } from '../state/ResumeContext';
import EmailResumeModal from './EmailResumeModal';

export default function LiveResumePreview() {
  const { resume, activeTemplate, setActiveTemplate, templates } = useResume();
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [zoom, setZoom] = useState(0.85);

  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await renderResumeHtml(resume, activeTemplate);
        if (isMounted) {
          setHtmlContent(res.html);
        }
      } catch (err) {
        console.error("Preview render error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPreview, 250);
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [resume, activeTemplate]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadResumePdf(resume, activeTemplate);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to generate PDF. Please ensure the backend server is running.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-4 lg:p-6 shadow-xl text-white flex flex-col h-full sticky top-20">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        {/* Template Selector */}
        <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          {['classic', 'modern', 'compact'].map((tId) => (
            <button
              key={tId}
              onClick={() => setActiveTemplate(tId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTemplate === tId
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tId}
            </button>
          ))}
        </div>

        {/* Zoom & Download */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-slate-300">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}
              className="p-1 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(0.85)}
              className="p-1 hover:text-white hover:bg-slate-700 rounded"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setEmailModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all"
            title="Email Resume as PDF"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Email PDF</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloading ? 'Rendering PDF...' : 'Download ATS PDF'}</span>
          </button>
        </div>
      </div>

      <EmailResumeModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />

      {/* Preview Sheet Area */}
      <div className="flex-1 overflow-auto mt-4 flex justify-center items-start p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 min-h-[600px] max-h-[85vh]">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className="shadow-2xl rounded-sm bg-white text-slate-900 w-[210mm] min-h-[297mm] p-0 relative"
        >
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Updating live preview...</span>
              </div>
            </div>
          )}

          {/* Iframe or Rendered Shadow Container */}
          <iframe
            title="Resume Live Preview"
            srcDoc={htmlContent}
            className="w-full min-h-[297mm] border-0 rounded-sm bg-white"
            style={{ height: '1120px' }}
          />
        </div>
      </div>
    </div>
  );
}
