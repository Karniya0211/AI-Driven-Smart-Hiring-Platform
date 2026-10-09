import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Briefcase, LogOut, ArrowRightLeft, FileText, CheckCircle2 } from 'lucide-react';

export default function Navbar({ onOpenAuth }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-dark-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base lg:text-lg tracking-tight text-white">
                SkillMatch<span className="gradient-text-primary">.AI</span>
              </span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                3-Model Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AI Resume Matcher & Career Recommender</p>
          </div>
        </div>

        {/* Active Portal Badge (No cross-role switching) */}
        <div className="flex items-center">
          {user?.role === 'candidate' ? (
            <div className="flex items-center gap-2 px-2 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Candidate Portal</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Recruiter Suite</span>
            </div>
          )}
        </div>

        {/* Right User Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* User Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-dark-800/90 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-200 leading-tight">{user.full_name}</p>
                  <p className="text-[10px] capitalize text-indigo-400 font-medium">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded-md transition-colors ml-1 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Sign In / Register
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
