import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Users, Video, Calendar, Clock, Mail, CheckCircle2, 
  AlertCircle, ArrowLeft, Loader2, Sparkles, X, FileText, Send, HelpCircle 
} from 'lucide-react';
import { getJobApplicants, scheduleInterview, getInterviewerQuestionSheet } from '../api/client';
import InterviewQuestionsPanel from '../components/InterviewQuestionsPanel';

export default function JobApplicants() {
  const { jobId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Schedule Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [schedForm, setSchedForm] = useState({
    interview_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    interview_time: '14:00 (2:00 PM IST)',
    platform: 'Google Meet',
    custom_meeting_link: '',
    interviewer_notes: ''
  });
  const [schedSuccessMsg, setSchedSuccessMsg] = useState('');

  // Question Sheet Modal
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionSheet, setQuestionSheet] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await getJobApplicants(jobId);
      setData(res);
    } catch (err) {
      console.error('Failed to load applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSchedule = (app) => {
    setSelectedApp(app);
    setSchedSuccessMsg('');
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setScheduling(true);
    setSchedSuccessMsg('');

    try {
      const res = await scheduleInterview({
        application_id: selectedApp.id,
        candidate_name: selectedApp.candidate_name,
        candidate_email: selectedApp.candidate_email,
        job_title: data?.job?.title || 'Engineering Role',
        company_name: data?.job?.company_name || 'TechCorp',
        interview_date: schedForm.interview_date,
        interview_time: schedForm.interview_time,
        platform: schedForm.platform,
        custom_meeting_link: schedForm.custom_meeting_link,
        interviewer_notes: schedForm.interviewer_notes
      });

      setSchedSuccessMsg(res.message);
      await fetchApplicants();
      setTimeout(() => {
        setScheduleModalOpen(false);
        setSchedSuccessMsg('');
      }, 2500);
    } catch (err) {
      console.error('Scheduling error:', err);
      alert('Failed to schedule interview.');
    } finally {
      setScheduling(false);
    }
  };

  const handleViewQuestions = async (app) => {
    setSelectedApp(app);
    setQuestionModalOpen(true);
    setLoadingQuestions(true);
    try {
      const sheet = await getInterviewerQuestionSheet(app.id);
      setQuestionSheet(sheet);
    } catch (err) {
      console.error('Questions fetch error:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-xs text-slate-500 font-medium">Auditing and ranking applicants by ATS score...</p>
      </div>
    );
  }

  const job = data?.job;
  const applications = data?.applications || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Link to="/jobs" className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Job Board</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Applicant ATS Matrix: {job?.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {job?.company_name} &bull; Minimum Cutoff: <strong>{job?.min_ats_cutoff} pts</strong> &bull; Total Candidates: <strong>{applications.length}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Shortlisted: {data?.shortlisted_count || 0}</span>
          </span>
        </div>
      </div>

      {/* Applicants List Table */}
      {applications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No candidates have applied for this position yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase font-semibold">
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">ATS Match Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-right">Recruiter Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => {
                  const isPassed = app.ats_score >= (job?.min_ats_cutoff || 70);
                  const isScheduled = app.status === 'interview_scheduled';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        <div>{app.candidate_name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">Applied {new Date(app.created_at).toLocaleDateString()}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-1 rounded-full font-extrabold text-xs border ${
                            isPassed 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {app.ats_score} / 100
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {isPassed ? '✓ Cutoff met' : 'Below cutoff'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          isScheduled
                            ? 'bg-indigo-100 text-indigo-800'
                            : isPassed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {app.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        <div>{app.candidate_email}</div>
                        {app.candidate_phone && <div className="text-[11px] text-slate-400">{app.candidate_phone}</div>}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* View Question Bank */}
                          <button
                            onClick={() => handleViewQuestions(app)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center space-x-1"
                            title="Generate role & resume questions for interviewer"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Question Sheet</span>
                          </button>

                          {/* Schedule Interview with Google Meet / Zoom */}
                          <button
                            onClick={() => handleOpenSchedule(app)}
                            className={`px-3.5 py-1.5 font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5 ${
                              isScheduled
                                ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{isScheduled ? 'Reschedule' : 'Schedule Meet'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {scheduleModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Schedule Interview & Send Invite</h3>
                <p className="text-[11px] text-slate-500">Candidate: {selectedApp.candidate_name} ({selectedApp.candidate_email})</p>
              </div>
              <button onClick={() => setScheduleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {schedSuccessMsg && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{schedSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interview Date *</label>
                  <input
                    type="date"
                    required
                    value={schedForm.interview_date}
                    onChange={(e) => setSchedForm({ ...schedForm, interview_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time & Timezone *</label>
                  <input
                    type="text"
                    required
                    value={schedForm.interview_time}
                    onChange={(e) => setSchedForm({ ...schedForm, interview_time: e.target.value })}
                    placeholder="e.g. 14:00 (2:00 PM IST)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Video Platform</label>
                <select
                  value={schedForm.platform}
                  onChange={(e) => setSchedForm({ ...schedForm, platform: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                >
                  <option value="Google Meet">Google Meet (Auto-generated link)</option>
                  <option value="Zoom">Zoom (Auto-generated link)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Meeting Link (Optional)</label>
                <input
                  type="text"
                  value={schedForm.custom_meeting_link}
                  onChange={(e) => setSchedForm({ ...schedForm, custom_meeting_link: e.target.value })}
                  placeholder="Leave empty to auto-generate link"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Interviewer Notes / Agenda</label>
                <textarea
                  rows={2}
                  value={schedForm.interviewer_notes}
                  onChange={(e) => setSchedForm({ ...schedForm, interviewer_notes: e.target.value })}
                  placeholder="e.g. Round 1 Technical & System Architecture deep-dive"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>An official invitation email with the video link will be dispatched to <strong>{selectedApp.candidate_email}</strong>.</span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow flex items-center space-x-1.5"
                >
                  {scheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{scheduling ? 'Scheduling & Emailing...' : 'Schedule & Email Invite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Sheet Modal */}
      {questionModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Interviewer Question Sheet: {selectedApp.candidate_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Role: <strong>{job?.title}</strong> &bull; Tailored to candidate's verified projects & technologies
                </p>
              </div>
              <button onClick={() => setQuestionModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingQuestions ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mb-2" />
                <p className="text-xs text-slate-500">Analyzing resume bullets and generating question bank...</p>
              </div>
            ) : questionSheet ? (
              <InterviewQuestionsPanel 
                questions={questionSheet.questions || []} 
                targetRole={job?.title || 'Engineering'} 
              />
            ) : (
              <p className="text-xs text-slate-500">Could not generate questions.</p>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setQuestionModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Close Question Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
