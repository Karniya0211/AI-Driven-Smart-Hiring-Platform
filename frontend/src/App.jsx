import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import MotionBackground3D from './components/ContourBackground3D';
import { Brain, Cpu, Target } from 'lucide-react';

import LoginPage from './pages/LoginPage';

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading SkillMatch.AI...</p>
        </div>
      </div>
    );
  }

  // First show only the Login page if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative">
        <MotionBackground3D />
        <LoginPage />
      </div>
    );
  }

  // After login, display only the respective Candidate or Recruiter Dashboard based on account type
  const isCandidate = user.role === 'candidate';

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative">
      
      {/* Interactive 3D Motion Perspective Background */}
      <MotionBackground3D />

      {/* Navigation Bar (no cross-role switching) */}

      {/* Main Role-Specific Dashboard Content */}
      <div className="flex-1 min-w-0 w-full">
        {isCandidate ? (
          <CandidateDashboard user={user} />
        ) : (
          <RecruiterDashboard user={user} />
        )}
      </div>

      {/* Sleek Footer */}
      <footer className="candidate-dashboard-footer border-t border-white/5 bg-dark-850/80 backdrop-blur-lg py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-600/30">
              S
            </div>
            <span className="font-bold text-white">AI Skill Resume Matcher & Recommender</span>
            <span>•</span>
            <span className="text-slate-400">Production Demo Edition</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Brain className="w-3.5 h-3.5" /> Model 1 (NLP Extraction)
            </span>
            <span className="flex items-center gap-1.5 text-pink-400">
              <Cpu className="w-3.5 h-3.5" /> Model 2 (TF-IDF Match)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Target className="w-3.5 h-3.5" /> Model 3 (Skill Gap Engine)
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
