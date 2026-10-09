import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import { BarChart3, TrendingUp, AlertCircle, Sparkles, Filter } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl border border-white/10 shadow-2xl text-xs">
        <p className="font-bold text-white mb-1.5 border-b border-white/10 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-slate-200">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomSeverityTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel p-3 rounded-xl border border-white/10 shadow-2xl text-xs">
        <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-white/10 pb-1">
          <span className="font-bold text-white">{data.skill}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            data.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
            data.priority === 'High' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
          }`}>
            {data.priority} Gap
          </span>
        </div>
        <p className="text-slate-300">Severity Index: <span className="font-bold text-white">{data.severity}/100</span></p>
        <p className="text-slate-300">Target Time: <span className="font-bold text-indigo-300">{data.timeToMaster}</span></p>
        <p className="text-emerald-400 font-semibold mt-1">Expected Match Boost: {data.impact}</p>
      </div>
    );
  }
  return null;
};

export default function SkillGapCharts({ groupedData = [], severityData = [] }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'gaps_only'

  // Prepare grouped bar chart data with filter
  const filteredGroupedData = filterMode === 'gaps_only'
    ? groupedData.filter(d => d.status === 'Skill Gap')
    : groupedData;

  // Severity color calculation
  const getSeverityColor = (priority) => {
    if (priority === 'Critical') return '#F43F5E'; // Rose-500
    if (priority === 'High') return '#F59E0B';     // Amber-500
    return '#06B6D4';                             // Cyan-500
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      
      {/* 1. Grouped Bar Chart: Candidate Skills vs Required Skills */}
      <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-white/10 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm lg:text-base font-bold text-white tracking-tight">
                  Candidate Skills vs Required Skills
                </h3>
                <p className="text-xs text-slate-400">Interactive comparison of proficiency and role benchmarks</p>
              </div>
            </div>

            {/* Filter toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-dark-800 border border-white/5 text-[11px]">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  filterMode === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('gaps_only')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  filterMode === 'gaps_only' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gaps Only
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 mb-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-400" />
              <span>Candidate Skill Level</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500" />
              <span>Required Role Benchmark</span>
            </div>
          </div>
        </div>

        {/* Recharts Grouped Bar Chart Container */}
        <div className="h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredGroupedData}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis
                dataKey="skill"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
              <Bar
                name="Candidate"
                dataKey="candidateScore"
                fill="#06B6D4"
                radius={[4, 4, 0, 0]}
                animationDuration={1200}
              />
              <Bar
                name="Required"
                dataKey="requiredScore"
                fill="#6366F1"
                radius={[4, 4, 0, 0]}
                animationDuration={1200}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-3">
          <span>Acquired: <b className="text-emerald-400">{groupedData.filter(d => d.status === 'Acquired').length}</b></span>
          <span>Skill Gaps: <b className="text-rose-400">{groupedData.filter(d => d.status === 'Skill Gap').length}</b></span>
          <span>Extra Strengths: <b className="text-cyan-400">{groupedData.filter(d => d.status === 'Bonus Strength').length}</b></span>
        </div>
      </div>

      {/* 2. Horizontal Bar Chart: Skill Gap Severity */}
      <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-white/10 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm lg:text-base font-bold text-white tracking-tight">
                  Skill Gap Severity & Priority
                </h3>
                <p className="text-xs text-slate-400">Horizontal severity ranking prioritized by role impact</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Critical</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">High</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Moderate</span>
            </div>
          </div>

          <div className="mt-3 mb-4 text-xs text-slate-400">
            Ranked by impact on Model 2 Match Score (higher score = faster match improvement)
          </div>
        </div>

        {/* Recharts Horizontal Bar Chart */}
        <div className="h-72 w-full mt-2">
          {severityData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Sparkles className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="font-semibold text-slate-200">Zero Critical Skill Gaps!</p>
              <p className="text-xs mt-1">Your candidate profile is strongly aligned with this position.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={severityData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  unit=" pts"
                />
                <YAxis
                  dataKey="skill"
                  type="category"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomSeverityTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                <Bar
                  dataKey="severity"
                  radius={[0, 6, 6, 0]}
                  animationDuration={1300}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSeverityColor(entry.priority)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-3">
          <span>Total Gaps Identified: <b className="text-amber-400">{severityData.length} skills</b></span>
          <span className="text-emerald-400 font-semibold">Remediate with Model 3 recommendations below</span>
        </div>
      </div>

    </div>
  );
}
