import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Video, Calendar, Clock, ExternalLink, Bot, HelpCircle, 
  CheckCircle2, AlertCircle, Loader2, Sparkles, Building, User 
} from 'lucide-react';
import { getMyInterviews, getInterviewerQuestionSheet } from '../api/client';
import { useAuth } from '../state/AuthContext';
import InterviewQuestionsPanel from '../components/InterviewQuestionsPanel';

export default function InterviewsList() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Question sheet modal
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [questionSheet, setQuestionSheet] = useState(null);
  const [loadingSheet, setLoadingSheet] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, [user]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await getMyInterviews(user?.email || '');
      setInterviews(res.interviews || []);
    } catch (err) {
      console.error('Failed to load interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSheet = async (interview) => {
    setSelectedInterview(interview);
    setSheetModalOpen(true);
    setLoadingSheet(true);
    try {
      const sheet = await getInterviewerQuestionSheet(interview.application_id || 1);
      setQuestionSheet(sheet);
    } catch (err) {
      console.error('Failed to fetch sheet:', err);
    } finally {
      setLoadingSheet(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Interviews & Video Meet Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your scheduled Google Meet / Zoom sessions, launch the live Autonomous AI Mock Room, or view customized question sheets.
          </p>
        </div>

        <Link
          to="/interview-room"
          className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all"
        >
          <Bot className="w-4 h-4" />
          <span>Launch AI Mock Interview Room</span>
        </Link>
      </div>

      {/* Interviews Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading scheduled interviews...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 max-w-xl mx-auto space-y-3">
          <Video className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No scheduled interviews yet</h3>
          <p className="text-xs text-slate-500">
            When a company shortlists your resume or a recruiter schedules a session, your meeting details and Google Meet/Zoom link will appear here.
          </p>
          <div className="pt-2">
            <Link
              to="/interview-room"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow inline-flex items-center space-x-2"
            >
              <Bot className="w-4 h-4" />
              <span>Practice in AI Mock Room Now</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Video className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">
                    {item.platform}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                  {item.job_title}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">{item.company_name || 'Hiring Partner'}</p>

                <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Candidate: <strong>{item.candidate_name}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Date: <strong>{item.interview_date}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Time: <strong>{item.interview_time}</strong></span>
                  </div>
                </div>

                {item.interviewer_notes && (
                  <p className="text-[11px] text-slate-500 mt-2 italic line-clamp-2">
                    Notes: {item.interviewer_notes}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenSheet(item)}
                  className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center space-x-1"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Question Sheet</span>
                </button>

                <a
                  href={item.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center space-x-1.5"
                >
                  <span>Join Meeting</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Sheet Modal */}
      {sheetModalOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Interviewer Question Sheet: {selectedInterview.candidate_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Role: <strong>{selectedInterview.job_title}</strong> &bull; {selectedInterview.company_name}
                </p>
              </div>
              <button onClick={() => setSheetModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            {loadingSheet ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mb-2" />
                <p className="text-xs text-slate-500">Generating tailored interview question sheet...</p>
              </div>
            ) : questionSheet ? (
              <InterviewQuestionsPanel 
                questions={questionSheet.questions || []} 
                targetRole={selectedInterview.job_title} 
              />
            ) : (
              <p className="text-xs text-slate-500">No question sheet available.</p>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSheetModalOpen(false)}
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
