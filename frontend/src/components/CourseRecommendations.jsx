import React, { useState } from 'react';
import { BookOpen, ExternalLink, Star, Clock, CheckCircle, ShieldCheck } from 'lucide-react';

export default function CourseRecommendations({ recommendations = [] }) {
  const [selectedProvider, setSelectedProvider] = useState('All');

  const providers = ['All', ...new Set(recommendations.map(r => r.provider))];
  const filtered = selectedProvider === 'All'
    ? recommendations
    : recommendations.filter(r => r.provider === selectedProvider);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Curated Courses & Certifications
            </h3>
            <p className="text-xs text-slate-400">Targeted learning resources to bridge your identified skill gaps</p>
          </div>
        </div>

        {/* Provider Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full text-xs">
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProvider(p)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                selectedProvider === p
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-dark-800 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          No courses found for the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((course, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-dark-800/80 border border-white/10 hover:border-indigo-500/40 hover:bg-dark-750 transition-all flex flex-col justify-between group shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 truncate">
                    {course.skill}
                  </span>
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {course.rating}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                  {course.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{course.provider}</p>

                <div className="mt-3 flex items-center gap-3 text-[10.5px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {course.duration}
                  </span>
                  <span>•</span>
                  <span className="text-slate-300 font-medium">{course.level}</span>
                </div>

                {course.certification && course.certification !== "No" && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Certification Included</span>
                  </div>
                )}
              </div>

              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full py-2 rounded-lg bg-dark-700 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span>Explore Course</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
