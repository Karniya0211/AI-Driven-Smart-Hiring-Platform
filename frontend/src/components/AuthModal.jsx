import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, User, Briefcase, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('candidate'); // 'candidate' or 'recruiter'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network or server error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-panel rounded-3xl p-6 lg:p-7 border border-white/10 shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-white">
            {isRegister ? "Create Your Account" : "Sign In to SkillMatch.AI"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access your persistent matching constraints and recommendations
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Alex Chen"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    role === 'candidate'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                      : 'bg-dark-800 text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    role === 'recruiter'
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow'
                      : 'bg-dark-800 text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                >
                  Recruiter
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center mt-5 text-xs text-slate-400">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-indigo-400 font-bold hover:underline"
          >
            {isRegister ? "Sign In" : "Sign Up"}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
