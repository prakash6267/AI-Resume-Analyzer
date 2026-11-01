import React, { useState } from 'react';
import { Mail, X, Send, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { sendResumeEmail } from '../api/client';
import { useResume } from '../state/ResumeContext';

export default function EmailResumeModal({ isOpen, onClose }) {
  const { resume, activeTemplate } = useResume();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState(
    `Resume Application - ${resume.personal?.full_name || 'Candidate'} (${resume.target_role || 'Engineering'})`
  );
  const [messageBody, setMessageBody] = useState(
    `Dear Hiring Team,\n\nPlease find attached my tailored, single-column ATS resume for your review. I look forward to discussing how my skills and experience align with your requirements.\n\nBest regards,\n${resume.personal?.full_name || 'Candidate'}`
  );
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipientEmail) {
      setErrorMsg('Please enter a recipient email address.');
      return;
    }

    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');

    try {
      const res = await sendResumeEmail({
        recipient_email: recipientEmail,
        subject: subject,
        message_body: messageBody,
        resume: resume,
        template_id: activeTemplate || 'classic',
        sender_name: resume.personal?.full_name || 'Candidate'
      });

      setStatusMsg(res.message || 'Resume emailed successfully!');
      setTimeout(() => {
        onClose();
        setStatusMsg('');
      }, 2500);
    } catch (err) {
      console.error("Email send error:", err);
      setErrorMsg(err.response?.data?.detail || 'Failed to dispatch email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Email Resume as PDF</h3>
              <p className="text-xs text-slate-500">Dispatch ATS-compliant PDF directly to inbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Recipient Email Address *
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. recruiter@company.com or your email"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cover Note / Message Body
            </label>
            <textarea
              rows={4}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2 text-[11px] text-slate-500">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Attachment: <strong>{resume.personal?.full_name || 'Resume'}_{activeTemplate}.pdf</strong> will be rendered and attached automatically.</span>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{loading ? 'Sending Email...' : 'Send Resume'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
