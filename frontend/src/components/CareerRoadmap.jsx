import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, CheckCircle, Circle, Award, Code2, Calendar, Sparkles } from 'lucide-react';

export default function CareerRoadmap({ roadmap = [] }) {
  const [completedItems, setCompletedItems] = useState({});

  const toggleItem = (phaseIndex, itemIndex) => {
    const key = `${phaseIndex}-${itemIndex}`;
    setCompletedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const totalDeliverables = roadmap.reduce((acc, phase) => acc + (phase.deliverables?.length || 0), 0);
  const completedCount = Object.values(completedItems).filter(Boolean).length;
  const progressPct = totalDeliverables > 0 ? Math.round((completedCount / totalDeliverables) * 100) : 0;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Model 3: 12-Week Milestone Career Roadmap
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                Personalized
              </span>
            </div>
            <p className="text-xs text-slate-400">Structured action plan to close skill gaps and achieve target role readiness</p>
          </div>
        </div>

        {/* Interactive Progress Meter */}
        <div className="flex items-center gap-3 bg-dark-800/90 px-3.5 py-2 rounded-xl border border-white/10">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Roadmap Progress</p>
            <p className="text-xs font-bold text-white">{completedCount} of {totalDeliverables} Completed ({progressPct}%)</p>
          </div>
          <div className="w-16 h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Roadmap Timeline Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        {roadmap.map((phase, pIdx) => {
          return (
            <motion.div
              key={pIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pIdx * 0.15 }}
              className="rounded-2xl p-5 bg-dark-800/70 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-lg relative group"
            >
              <div>
                {/* Phase Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {phase.timeline}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    pIdx === 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700/50 text-slate-300'
                  }`}>
                    {phase.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {phase.phase}
                </h4>
                <p className="text-xs text-slate-300 mt-1 font-medium italic">
                  "{phase.focus}"
                </p>

                {/* Target Skills Pills */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {phase.targetSkills?.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[10.5px] px-2 py-0.5 rounded-md bg-dark-750 text-cyan-300 font-mono font-medium border border-cyan-500/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Milestone Goal */}
                <div className="mt-3 p-2.5 rounded-xl bg-dark-750/70 border border-white/5 text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-indigo-300 block mb-0.5">Objective:</span>
                  {phase.milestoneGoal}
                </div>

                {/* Interactive Deliverables Checklist */}
                <div className="mt-3.5 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action Items:</p>
                  {phase.deliverables?.map((item, dIdx) => {
                    const isDone = !!completedItems[`${pIdx}-${dIdx}`];
                    return (
                      <div
                        key={dIdx}
                        onClick={() => toggleItem(pIdx, dIdx)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                          isDone
                            ? 'bg-emerald-500/10 text-slate-400 line-through'
                            : 'bg-dark-900/60 hover:bg-dark-700/60 text-slate-200'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs leading-tight select-none">{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Badge */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1 font-medium">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Outcome:
                </span>
                <span className="font-bold text-emerald-400">{phase.badge}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
