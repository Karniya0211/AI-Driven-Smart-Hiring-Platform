import React, { useState, useEffect } from 'react';
import { Sliders, Save, RotateCcw, Check, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function ConstraintsPanel({ user, onConstraintsChange }) {
  // Initially, all constraints are strictly 0
  const candidateInitial = {
    min_match_score: 0,
    min_experience_years: 0,
    skill_gap_threshold: 0,
    salary_expectation_k: 0,
    required_skills_weight: 0
  };

  const recruiterInitial = {
    min_candidate_score: 0,
    min_years_experience: 0,
    min_matched_skills: 0,
    max_pool_size: 0
  };

  const isRecruiter = user?.role === 'recruiter';
  const initialBase = isRecruiter ? recruiterInitial : candidateInitial;

  const [constraints, setConstraints] = useState(initialBase);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // After login, load user's saved constraints; for new users, keep them at 0
  useEffect(() => {
    if (!user) {
      setConstraints(initialBase);
      return;
    }

    // Load from user object or fetch from server
    if (user.constraints && Object.keys(user.constraints).length > 0) {
      const merged = { ...initialBase, ...user.constraints };
      setConstraints(merged);
      if (onConstraintsChange) onConstraintsChange(merged);
    } else {
      // Fetch from API to be sure
      api.getUserConstraints()
        .then(res => {
          if (res?.constraints) {
            const merged = { ...initialBase, ...res.constraints };
            setConstraints(merged);
            if (onConstraintsChange) onConstraintsChange(merged);
          } else {
            setConstraints(initialBase);
          }
        })
        .catch(() => setConstraints(initialBase));
    }
  }, [user?.id, user?.role]);

  const handleChange = (key, value) => {
    const updated = { ...constraints, [key]: Number(value) };
    setConstraints(updated);
    setSavedSuccess(false);
    if (onConstraintsChange) onConstraintsChange(updated);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.updateUserConstraints(constraints);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save constraints", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToZero = async () => {
    setConstraints(initialBase);
    setSavedSuccess(false);
    if (onConstraintsChange) onConstraintsChange(initialBase);
    if (user) {
      setSaving(true);
      try {
        await api.updateUserConstraints(initialBase);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-white/10 shadow-xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-md">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                AI Matching & Filter Constraints
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Persistent
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Initially set to <b className="text-white">0</b>. Saved changes are tied to your account and restored on every login.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToZero}
            className="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white text-xs font-semibold border border-white/5 transition-all flex items-center gap-1.5"
            title="Reset all constraints to 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to 0
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !user}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              savedSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 disabled:opacity-50'
            }`}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : savedSuccess ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {savedSuccess ? 'Saved to Account' : 'Save Constraints'}
          </button>
        </div>
      </div>

      {/* Constraints Sliders Grid */}
      {!isRecruiter ? (
        // Candidate Constraints
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">Min Match Score Cutoff:</span>
              <span className="font-mono font-bold text-indigo-400 text-xs">{constraints.min_match_score || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={constraints.min_match_score || 0}
              onChange={(e) => handleChange('min_match_score', e.target.value)}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-dark-700 rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Filters out jobs below this score</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">Min Experience Filter:</span>
              <span className="font-mono font-bold text-cyan-400 text-xs">{constraints.min_experience_years || 0} yrs</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={constraints.min_experience_years || 0}
              onChange={(e) => handleChange('min_experience_years', e.target.value)}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-dark-700 rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Years of role experience filter</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">Skill Gap Tolerance:</span>
              <span className="font-mono font-bold text-amber-400 text-xs">{constraints.skill_gap_threshold || 0} gaps</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={constraints.skill_gap_threshold || 0}
              onChange={(e) => handleChange('skill_gap_threshold', e.target.value)}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-dark-700 rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Max allowed missing skills (0 = unconstrained)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">Min Salary Floor:</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">${constraints.salary_expectation_k || 0}k</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="10"
              value={constraints.salary_expectation_k || 0}
              onChange={(e) => handleChange('salary_expectation_k', e.target.value)}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-dark-700 rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Minimum compensation filter</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5 sm:col-span-2 lg:col-span-2">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">Required Skills Strictness:</span>
              <span className="font-mono font-bold text-purple-400 text-xs">{constraints.required_skills_weight || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={constraints.required_skills_weight || 0}
              onChange={(e) => handleChange('required_skills_weight', e.target.value)}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-dark-700 rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Weighting applied to core mandatory requirements</span>
          </div>

        </div>
      ) : (
        // Recruiter Constraints
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">Min Candidate Score:</span>
              <span className="font-mono font-bold text-cyan-400 text-xs">{constraints.min_candidate_score || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={constraints.min_candidate_score || 0}
              onChange={(e) => handleChange('min_candidate_score', e.target.value)}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-dark-700 rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Shortlist candidates meeting score</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">Min Experience Years:</span>
              <span className="font-mono font-bold text-indigo-400 text-xs">{constraints.min_years_experience || 0} yrs</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={constraints.min_years_experience || 0}
              onChange={(e) => handleChange('min_years_experience', e.target.value)}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-dark-700 rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Minimum experience threshold</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">Min Matched Skills:</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">{constraints.min_matched_skills || 0} skills</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={constraints.min_matched_skills || 0}
              onChange={(e) => handleChange('min_matched_skills', e.target.value)}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-dark-700 rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Minimum matched required skills</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">Max Pool Display Limit:</span>
              <span className="font-mono font-bold text-purple-400 text-xs">
                {constraints.max_pool_size === 0 ? 'All' : constraints.max_pool_size}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={constraints.max_pool_size || 0}
              onChange={(e) => handleChange('max_pool_size', e.target.value)}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-dark-700 rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block mt-1">0 = Display all applicants</span>
          </div>

        </div>
      )}

      {/* Save status notification footnote */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          {user ? `Active User: ${user.full_name} (${user.email})` : 'Unauthenticated (Sign in to save)'}
        </span>
        <span>
          {savedSuccess ? (
            <b className="text-emerald-400">All constraints saved and synchronized!</b>
          ) : (
            'Adjust sliders and click "Save Constraints" to persist'
          )}
        </span>
      </div>

    </div>
  );
}
