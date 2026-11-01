import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/AuthContext';
import { ResumeProvider } from './state/ResumeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BuilderWizard from './pages/BuilderWizard';
import ReviewEdit from './pages/ReviewEdit';
import AtsUpload from './pages/AtsUpload';
import AtsReport from './pages/AtsReport';
import AtsEnhance from './pages/AtsEnhance';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SystemSettings from './pages/SystemSettings';
import JobBoard from './pages/JobBoard';
import JobApplicants from './pages/JobApplicants';
import InterviewsList from './pages/InterviewsList';
import AIInterviewRoom from './pages/AIInterviewRoom';
import ChatbotWidget from './components/ChatbotWidget';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ResumeProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-slate-900 selection:text-white relative">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public & Workspace Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/builder" element={<BuilderWizard />} />
                <Route path="/review" element={<ReviewEdit />} />
                <Route path="/ats" element={<AtsUpload />} />
                <Route path="/ats/report" element={<AtsReport />} />
                <Route path="/ats/enhance" element={<AtsEnhance />} />
                
                {/* Company Recruitment & ATS Job Portal */}
                <Route path="/jobs" element={<JobBoard />} />
                <Route path="/jobs/:jobId/applicants" element={<JobApplicants />} />
                <Route path="/interviews" element={<InterviewsList />} />
                <Route path="/interview-room" element={<AIInterviewRoom />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* User Dashboard & Management */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/settings" element={<SystemSettings />} />
              </Routes>
            </main>
            
            {/* Global Context-Aware AI Career & Recruiter Assistant */}
            <ChatbotWidget />
            
            {/* Clean Footer */}
            <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800">ResumeAI Platform</span>
                  <span>•</span>
                  <span>ATS Resume Builder & Analyzer</span>
                  <span>•</span>
                  <span>Single-Column PDF Exporter</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-400">
                  <span>FastAPI & React</span>
                  <span>•</span>
                  <span>Built with SQLite & JWT Auth</span>
                </div>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </ResumeProvider>
    </AuthProvider>
  );
}
