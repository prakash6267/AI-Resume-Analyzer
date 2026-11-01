import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, 
  ShieldCheck, ArrowRight, FileCheck2 
} from 'lucide-react';
import { uploadResumeFile, scoreResume } from '../api/client';
import { useResume } from '../state/ResumeContext';

export default function AtsUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { 
    setResume, setAtsReport, setUploadedFileName, 
    targetRole, setTargetRole, jobDescription, setJobDescription
  } = useResume();

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setErrorMsg('');
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setErrorMsg('Please upload a .pdf or .docx document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 10MB maximum limit.');
      return;
    }
    setSelectedFile(file);
    setUploadedFileName(file.name);
  };

  const handleProcessUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select or drop a resume file first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setLoadingStage('Extracting text & structuring resume data...');

    try {
      // 1. Upload & parse
      const uploadRes = await uploadResumeFile(selectedFile, targetRole);
      setResume(uploadRes.resume);

      // 2. Score with 100-point rubric
      setLoadingStage('Auditing resume against 100-point ATS rubric...');
      const report = await scoreResume(
        uploadRes.resume,
        targetRole || uploadRes.resume.target_role,
        jobDescription
      );
      setAtsReport(report);

      navigate('/ats/report');
    } catch (err) {
      console.error("Upload error:", err);
      const detail = err.response?.data?.detail || "Processing service busy, please try again.";
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold mb-3">
          <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>ATS Compliance Scanner & Auditor</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Audit & Score Your Resume
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Upload your resume in PDF or DOCX format to receive an estimated ATS score out of 100 with rubric breakdown.
        </p>
      </div>

      <form onSubmit={handleProcessUpload} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-100 space-y-6">
        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to scan
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setUploadedFileName('');
                }}
                className="mt-3 text-xs text-rose-600 hover:underline font-semibold"
              >
                Change File
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Drag and drop your resume here, or <span className="text-indigo-600 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports PDF and DOCX files up to 10 MB
              </p>
            </div>
          )}
        </div>

        {/* Optional Targeting Fields */}
        <div className="grid grid-cols-1 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Job Role (Optional, e.g. Senior Full Stack Engineer)
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Job Description (Optional, for precise keyword gap analysis)
            </label>
            <textarea
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job posting text here to identify matched vs missing role keywords..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Privacy badge */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Secure parsing with zero data sharing and strict memory isolation.</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedFile}
          className="w-full py-3.5 px-6 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>{loadingStage || 'Auditing Resume...'}</span>
            </>
          ) : (
            <>
              <span>Scan & Score Resume</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
