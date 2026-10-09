import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, Briefcase, Lock, Mail, ArrowRight, Loader2, ShieldCheck, CheckCircle2, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('candidate'); // 'candidate' or 'recruiter'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await register(email, password, fullName, role);
      } else {
        res = await login(email, password);
      }

      if (!res.success) {
        setError(res.error || "Authentication failed. Please verify your credentials.");
      }
    } catch (err) {
      setError(err.message || "Network or server connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
      
      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 max-w-md"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 shadow-xl shadow-indigo-500/30 text-white mb-3">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          SkillMatch<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">.AI</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium">
          Multi-Model NLP Resume Matcher & Career Recommendation Platform
        </p>
      </motion.div>

      {/* Main Glassmorphic Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative backdrop-blur-xl bg-dark-850/80"
      >
        {/* Toggle Mode Buttons */}
        <div className="flex p-1 rounded-2xl bg-dark-900/90 border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegister
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isRegister
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name for Registration */}
          {isRegister && (
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Role Selector (Registration only) */}
          {isRegister && (
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">Account Role</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'candidate'
                      ? 'border-indigo-500 bg-indigo-500/15 text-white'
                      : 'border-white/5 bg-dark-800/80 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className={`w-3.5 h-3.5 ${role === 'candidate' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white">Candidate</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Job Seeker & Skill Gap Analysis</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'recruiter'
                      ? 'border-cyan-500 bg-cyan-500/15 text-white'
                      : 'border-white/5 bg-dark-800/80 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className={`w-3.5 h-3.5 ${role === 'recruiter' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white">Recruiter</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Talent Pool & Applicant Match</p>
                </button>
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? "Register & Enter Dashboard" : "Sign In to Dashboard"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Security / Feature Highlights */}
        <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-2 gap-3 text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Role-Based Access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Persistent Constraints</span>
          </div>
        </div>
      </motion.div>

      {/* Footer text */}
      <div className="mt-8 text-center text-xs text-slate-400">
        AI Skill Resume Matcher & Recommender • Initial constraints & gaps start at 0
      </div>

    </div>
  );
}
