import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileUp,
  Brain,
  Layers,
  Cpu,
  Target,
  AlertTriangle,
  Lightbulb,
  FileCheck2,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: 1,
    title: "Resume Upload",
    tag: "Ingestion",
    icon: FileUp,
    color: "from-blue-500 to-cyan-500",
    glow: "rgba(56, 189, 248, 0.4)",
    desc: "Multi-format PDF, DOCX, and raw text parser extracting unformatted text and structure."
  },
  {
    id: 2,
    title: "Model 1: NLP Extractor",
    tag: "spaCy / NLP",
    icon: Brain,
    color: "from-indigo-500 to-purple-500",
    glow: "rgba(99, 102, 241, 0.4)",
    desc: "Extracts technical skills, experience metrics, education, and contact metadata using entity matching."
  },
  {
    id: 3,
    title: "Extracted Skills",
    tag: "6 Taxonomies",
    icon: Layers,
    color: "from-purple-500 to-pink-500",
    glow: "rgba(217, 70, 239, 0.4)",
    desc: "Classifies competencies across Languages, Frameworks, Cloud/DevOps, Databases, Tools & Soft Skills."
  },
  {
    id: 4,
    title: "Model 2: TF-IDF Matcher",
    tag: "Cosine Sim",
    icon: Cpu,
    color: "from-pink-500 to-rose-500",
    glow: "rgba(244, 63, 94, 0.4)",
    desc: "Transforms resume and job description into n-gram TF-IDF vectors to compute cosine semantic overlap."
  },
  {
    id: 5,
    title: "Match Score",
    tag: "0 – 100%",
    icon: Target,
    color: "from-emerald-500 to-teal-500",
    glow: "rgba(16, 185, 129, 0.4)",
    desc: "Weighted scoring: 60% Required Skills + 15% Preferred Skills + 25% TF-IDF Cosine Similarity."
  },
  {
    id: 6,
    title: "Model 3: Gap Engine",
    tag: "Gap Severity",
    icon: AlertTriangle,
    color: "from-amber-500 to-orange-500",
    glow: "rgba(245, 158, 11, 0.4)",
    desc: "Calculates missing required vs preferred skills and computes Severity Impact (Critical, High, Moderate)."
  },
  {
    id: 7,
    title: "Recommendations",
    tag: "Courses & Certs",
    icon: Lightbulb,
    color: "from-cyan-500 to-blue-500",
    glow: "rgba(6, 182, 212, 0.4)",
    desc: "Curates targeted learning resources from Coursera, Udemy, and Official Docs with estimated time-to-learn."
  },
  {
    id: 8,
    title: "Career Roadmap & Report",
    tag: "PDF & Milestones",
    icon: FileCheck2,
    color: "from-emerald-500 to-indigo-500",
    glow: "rgba(16, 185, 129, 0.4)",
    desc: "Produces 12-week 3-phase milestone roadmap and downloadable professional evaluation PDF."
  }
];

export default function PipelineWorkflow({ currentStage = 8, isProcessing = false }) {
  const [selectedStep, setSelectedStep] = useState(null);

  return (
    <div className="w-full glass-panel rounded-2xl p-6 lg:p-7 border border-white/10 shadow-2xl relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
            <h2 className="text-base lg:text-lg font-bold text-white tracking-tight">
              Interactive 3-Model AI Pipeline Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time end-to-end processing pipeline from raw resume ingestion to gap remediation
          </p>
        </div>

        {/* Processing badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-800/80 border border-white/10">
          <div className={`w-2.5 h-2.5 rounded-full ${isProcessing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          <span className="text-xs font-semibold text-slate-300">
            {isProcessing ? 'Processing Model Inference...' : 'Pipeline Active & Synchronized'}
          </span>
        </div>
      </div>

      {/* Animated Horizontal Stepper */}
      <div className="relative z-10 min-w-0 max-w-full overflow-x-auto pb-4 pt-2 no-scrollbar">
        <div className="flex items-center min-w-[980px] justify-between gap-1">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isPassed = step.id <= currentStage;
            const isActive = step.id === currentStage;
            const isSelected = selectedStep?.id === step.id;

            return (
              <React.Fragment key={step.id}>
                {/* Step Node */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedStep(isSelected ? null : step)}
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-indigo-400 rounded-xl' : ''
                  }`}
                >
                  <div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 shadow-md ${
                      isPassed
                        ? `bg-gradient-to-br ${step.color} text-white shadow-lg`
                        : 'bg-dark-800 text-slate-500 border border-white/10'
                    }`}
                    style={{
                      boxShadow: isPassed ? `0 0 18px ${step.glow}` : 'none'
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    
                    {/* Active pulse ring */}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    )}

                    {/* Step number badge */}
                    <div className="absolute -bottom-1.5 px-1.5 py-0.2 rounded-full bg-dark-900 border border-white/20 text-[9px] font-bold text-slate-300">
                      #{step.id}
                    </div>
                  </div>

                  {/* Title & Tag */}
                  <div className="text-center mt-3 max-w-[105px]">
                    <p className={`text-[11px] font-bold truncate ${isPassed ? 'text-slate-200' : 'text-slate-500'}`}>
                      {step.title}
                    </p>
                    <span className="inline-block text-[9.5px] font-semibold text-indigo-400/90 truncate">
                      {step.tag}
                    </span>
                  </div>
                </motion.div>

                {/* Animated Connector Arrow between steps */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="flex items-center justify-center px-1 flex-1 relative">
                    <div className="h-[2px] w-full bg-gradient-to-r from-white/10 via-indigo-500/40 to-white/10 relative overflow-hidden rounded-full">
                      {isPassed && (
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                        />
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400/60 -ml-1.5 shrink-0" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Collapsible/Interactive Detail Drawer for Selected Step */}
      <AnimatePresence>
        {selectedStep && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10 overflow-hidden relative z-10"
          >
            <div className="flex items-start justify-between p-4 rounded-xl bg-dark-800/90 border border-indigo-500/20">
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${selectedStep.color} text-white shadow-md`}>
                  <selectedStep.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">Stage {selectedStep.id}: {selectedStep.title}</h4>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                      {selectedStep.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {selectedStep.desc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStep(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md bg-dark-700/60 hover:bg-dark-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
