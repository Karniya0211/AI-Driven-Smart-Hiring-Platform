import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  FileBarChart,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  X,
  Zap,
  Target,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronDown,
  Loader2,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PipelineWorkflow from '../components/PipelineWorkflow';
import ResumeUploader from '../components/ResumeUploader';
import SkillGapCharts from '../components/SkillGapCharts';
import CareerRoadmap from '../components/CareerRoadmap';
import CourseRecommendations from '../components/CourseRecommendations';
import ConstraintsPanel from '../components/ConstraintsPanel';
import InterviewWorkspace from '../components/InterviewWorkspace';
import './CandidateDashboard.css';

export default function CandidateDashboard({ user }) {
  const { logout } = useAuth();
  const [pipelineData, setPipelineData] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeNav, setActiveNav] = useState('overview');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsProcessing(true);
    try {
      const [jobsRes, profileRes, stateRes, applicationsRes] = await Promise.all([
        api.getJobs(),
        api.getCandidateProfile().catch(() => null),
        api.getUserSavedState().catch(() => null),
        api.getCandidateApplications().catch(() => null)
      ]);
      setApplications(applicationsRes?.applications || []);

      const savedState = stateRes?.saved_state || {};
      setCandidateProfile(profileRes);
      const hasPriorInput = Boolean(
        profileRes?.profile?.has_resume ||
        savedState?.has_user_input ||
        (profileRes?.resume_text && profileRes.resume_text.trim().length > 0)
      );

      if (jobsRes.jobs && jobsRes.jobs.length > 0) {
        setJobs(jobsRes.jobs);
        
        // Restore previously selected job if exists, otherwise first job
        const targetJobId = (savedState.selected_job_id && jobsRes.jobs.some(j => j.id === savedState.selected_job_id))
          ? savedState.selected_job_id
          : jobsRes.jobs[0].id;

        setSelectedJobId(targetJobId);

        // Run pipeline with target job
        const pipeRes = await api.runPipeline(targetJobId);
        if (pipeRes) {
          setPipelineData(pipeRes);
          if (hasPriorInput || (pipeRes.has_user_input === true && pipeRes.model1?.skill_count > 0)) {
            setHasUserInput(true);
          }
          if (pipeRes.model2 && pipeRes.model2.match_score >= 80) {
            triggerConfetti();
          }
        }
      }
    } catch (err) {
      console.error("Initial load error", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJobChange = async (jobId) => {
    setSelectedJobId(jobId);
    setIsProcessing(true);
    try {
      // Persist chosen job and current input status to user's account
      api.updateUserSavedState({ selected_job_id: jobId, has_user_input: hasUserInput }).catch(() => {});

      const pipeRes = await api.runPipeline(jobId);
      if (pipeRes) {
        setPipelineData(pipeRes);
        if (hasUserInput || (pipeRes.has_user_input === true && pipeRes.model1?.skill_count > 0)) {
          setHasUserInput(true);
        }
        if (pipeRes.model2 && pipeRes.model2.match_score >= 80) {
          triggerConfetti();
        }
      }
    } catch (err) {
      console.error("Pipeline run error", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeProcessed = async (res) => {
    // User provided input (uploaded or pasted resume)
    setHasUserInput(true);
    setIsProcessing(true);
    try {
      const updatedProfile = await api.getCandidateProfile().catch(() => null);
      if (updatedProfile) setCandidateProfile(updatedProfile);
      // Persist updated state to user's account
      api.updateUserSavedState({ has_user_input: true, selected_job_id: selectedJobId }).catch(() => {});

      const pipeRes = await api.runPipeline(selectedJobId);
      if (pipeRes && pipeRes.model2) {
        setPipelineData(pipeRes);
        if (pipeRes.model2.match_score >= 80) {
          triggerConfetti();
        }
      }
    } catch (err) {
      console.error("Pipeline run error", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setApplicationMessage('');
    try {
      const blob = await api.downloadMatchReport(selectedJobId, user?.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resume_match_report.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setApplicationMessage(error.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleApplyToJob = async () => {
    if (!selectedJobId) return;
    setApplicationMessage('');
    try {
      const result = await api.createAtsApplication(selectedJobId);
      setApplications(current => [...current, result.application]);
      setApplicationMessage('Application submitted. Your resume match is now available to the recruiter.');
    } catch (error) {
      setApplicationMessage(error.message || 'Unable to submit your application.');
    }
  };

  const m1 = pipelineData?.model1;
  const m2 = pipelineData?.model2;
  const m3 = pipelineData?.model3;
  const targetJob = pipelineData?.target_job;
  const profile = candidateProfile?.profile;
  const extractedSkills = m1?.all_skills || profile?.extracted_skills?.all_skills || [];
  const skillComparisons = m3?.grouped_chart_data || [];
  const candidateName = user?.full_name || candidateProfile?.user?.full_name || 'Candidate';
  const resumeText = candidateProfile?.resume_text || '';
  const education = (m1?.metadata?.education || [])
    .filter((degree) => degree !== "Bachelor's in Computer Science" || /\b(B\.S\.|Bachelor|B\.Tech|M\.S\.|Master|Ph\.D\.|Diploma)\b/i.test(resumeText))
    .filter(Boolean)
    .join(', ') || 'Not found in resume';
  const visibleJobs = [...jobs]
    .sort((left, right) => Number(right.id === selectedJobId) - Number(left.id === selectedJobId))
    .filter((job) => `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 4);
  const focusSkills = (m3?.severity_chart_data || []).slice(0, 3).map((item) => item.skill);

  const score = m2?.match_score || 0;
  const displayScore = hasUserInput ? score : 0;
  const displayCandidateSkillGap = hasUserInput ? (m3?.total_gaps || 0) : 0;
  const displayModerateMatch = hasUserInput ? (m2?.moderate_match ?? (score >= 50 && score < 75 ? score : (score > 0 ? Math.round(score * 0.65) : 0))) : 0;
  const navigationItems = [
    { label: 'Dashboard', id: 'overview', icon: LayoutDashboard },
    { label: 'Resume', id: 'resume-section', icon: FileText },
    { label: 'Skills', id: 'skills-section', icon: Code2 },
    { label: 'Job Matching', id: 'job-matching', icon: Target },
    { label: 'Skill Gap Analysis', id: 'skill-gap-section', icon: Activity },
    { label: 'Recommendations', id: 'recommendations-section', icon: BookOpen },
    { label: 'Career Roadmap', id: 'roadmap-section', icon: TrendingUp },
    { label: 'Reports', id: 'reports-section', icon: FileBarChart }
  ];

  return (
    <div className={`candidate-dashboard${isDarkMode ? ' candidate-dashboard-dark' : ''}`}>
      {mobileNavOpen && <button className="candidate-mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`candidate-sidebar${mobileNavOpen ? ' candidate-sidebar-open' : ''}`}>
        <a href="#overview" className="candidate-brand" onClick={() => setMobileNavOpen(false)}>
          <span className="candidate-brand-mark"><Sparkles size={19} /></span>
          <span><strong>SkillMatch<span>.AI</span></strong><small>Career intelligence</small></span>
        </a>
        <button className="candidate-sidebar-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={18} /></button>
        <p className="candidate-nav-label">Workspace</p>
        <nav className="candidate-nav" aria-label="Candidate dashboard navigation">
          {navigationItems.map(({ label, id, icon: Icon }) => (
            <a key={id} href={`#${id}`} className={activeNav === id ? 'candidate-nav-active' : ''} aria-current={activeNav === id ? 'page' : undefined} onClick={() => { setMobileNavOpen(false); setActiveNav(id); }}>
              <Icon size={17} /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="candidate-sidebar-spacer" />
        <a href="#settings-section" className="candidate-settings-link" onClick={() => setMobileNavOpen(false)}><Settings size={17} /><span>Settings</span></a>
        <div className="candidate-sidebar-note"><span className="candidate-note-icon"><ShieldCheck size={16} /></span><span><strong>Your data stays yours</strong><small>Profile insights are private</small></span></div>
      </aside>

      <div className="candidate-main">
        <header className="candidate-topbar">
          <button className="candidate-icon-button candidate-mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button>
          <label className="candidate-search"><Search size={17} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search jobs, skills, or anything..." /><kbd>Ctrl K</kbd></label>
          <div className="candidate-topbar-actions">
            <button className="candidate-icon-button" aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setIsDarkMode((value) => !value)}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            <div className="candidate-popover-anchor">
              <button className="candidate-icon-button candidate-notification-button" aria-label="Notifications" aria-expanded={showNotifications} onClick={() => setShowNotifications((value) => !value)}><Bell size={18} /><span /></button>
              {showNotifications && <div className="candidate-popover"><strong>Activity</strong><p>{hasUserInput ? `Your resume is analyzed for ${targetJob?.title || 'your selected role'}.` : 'Upload a resume to start your first analysis.'}</p></div>}
            </div>
            <div className="candidate-popover-anchor">
              <button className="candidate-user-button" aria-expanded={showUserMenu} onClick={() => setShowUserMenu((value) => !value)}><span className="candidate-avatar">{candidateName.charAt(0).toUpperCase()}</span><span className="candidate-user-copy"><strong>{candidateName}</strong><small>Candidate</small></span><ChevronDown size={15} /></button>
              {showUserMenu && <div className="candidate-popover candidate-user-menu"><strong>{candidateName}</strong><p>{user?.email || candidateProfile?.user?.email || 'Candidate account'}</p><button onClick={logout}><LogOut size={15} /> Sign out</button></div>}
            </div>
          </div>
        </header>

        <main className="candidate-content">
      <div id="overview" className="space-y-8 pb-16">
      
      {/* Hero Banner with Executive Match Summary */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="w-full min-w-0 max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                YOUR CAREER, IN FOCUS
              </span>
              <span className="text-xs text-slate-400">AI-powered career workspace</span>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {candidateName.split(' ')[0]}
            </h1>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mt-1">AI Recruitment Dashboard</h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
              Find your best opportunities with AI-powered resume matching, skill gap analysis and personalized recommendations.
            </p>

            {/* Target Job Selector */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BriefcaseBusiness className="w-4 h-4 text-indigo-400" />
                Evaluating Against:
              </span>
              <div className="relative min-w-0 max-w-full flex-1">
                <select
                  value={selectedJobId || ''}
                  onChange={(e) => {
                    handleJobChange(Number(e.target.value));
                  }}
                  className="w-full max-w-full appearance-none rounded-xl bg-dark-800/90 border border-indigo-500/30 hover:border-indigo-500 text-xs font-bold text-white px-4 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md cursor-pointer"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} @ {j.company} ({j.experience_level})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Download PDF Action */}
              <button
                id="reports-section"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || !hasUserInput}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download PDF Report
              </button>
              {(() => {
                const application = applications.find(item => item.job_id === selectedJobId);
                return <button type="button" onClick={handleApplyToJob} disabled={!selectedJobId || Boolean(application)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-400/30 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold disabled:opacity-60">
                  <CheckCircle2 className="w-4 h-4" />{application ? `Applied · ${application.status}` : 'Apply to this role'}
                </button>;
              })()}
            </div>
            {applicationMessage && <p role="status" className="mt-3 text-xs text-cyan-200">{applicationMessage}</p>}
          </div>

          <div className="candidate-hero-art" aria-hidden="true">
            <div className="candidate-art-orbit candidate-art-orbit-one" />
            <div className="candidate-art-orbit candidate-art-orbit-two" />
            <div className="candidate-art-core"><BrainCircuit size={35} /></div>
            <span className="candidate-art-node candidate-art-node-top"><FileText size={16} /></span>
            <span className="candidate-art-node candidate-art-node-right"><Target size={16} /></span>
            <span className="candidate-art-node candidate-art-node-bottom"><Sparkles size={16} /></span>
            <i className="candidate-art-dot candidate-art-dot-a" /><i className="candidate-art-dot candidate-art-dot-b" />
          </div>

        </div>

        {/* 3 Prominent Stat Counters: Candidate Skill Gap, Moderate Match, Overall Match */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-dark-800/80 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Candidate Skill Gap</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 font-semibold">
                {hasUserInput ? "Analyzed" : "Initial: 0"}
              </span>
            </div>
            <p className="text-3xl font-black text-white mt-1">{displayCandidateSkillGap}</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasUserInput 
                ? `${m2?.missing_required_skills?.length || 0} core requirements missing`
                : "Changes only after resume input"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-800/80 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Moderate Match</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-semibold">
                {hasUserInput ? "Calculated" : "Initial: 0"}
              </span>
            </div>
            <p className="text-3xl font-black text-white mt-1">{displayModerateMatch}</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasUserInput 
                ? `${m2?.fit_level || "Moderate Match bracket"}`
                : "Changes only after resume input"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-800/80 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Overall Match Score</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-semibold">
                {hasUserInput ? "Calculated" : "Initial: 0%"}
              </span>
            </div>
            <p className="text-3xl font-black text-white mt-1">{displayScore}%</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasUserInput 
                ? `${m2?.total_matched_skills || 0} skills aligned`
                : "Changes only after resume input"}
            </p>
          </div>
        </div>

        {/* Informative notification when pending input */}
        {!hasUserInput && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2.5 text-xs text-indigo-300">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <b>Initial Assessment:</b> Candidate Skill Gap, Moderate Match, and Match Score are currently <b>0</b>. Upload or paste your resume below to evaluate your skill profile.
            </span>
          </div>
        )}
      </div>

      <section className="candidate-overview-grid" aria-label="Candidate overview">
        <motion.article className="candidate-overview-card candidate-resume-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="candidate-card-heading"><span className="candidate-card-icon candidate-icon-blue"><FileText size={18} /></span><span><small>PROFILE</small><strong>Resume Summary</strong></span></div>
          <div className="candidate-resume-person"><span className="candidate-resume-avatar">{candidateName.charAt(0).toUpperCase()}</span><span><strong>{candidateName}</strong><small>{profile?.headline || profile?.target_role || 'Add a resume to build your profile'}</small></span></div>
          <div className="candidate-resume-meta">
            <span><GraduationCap size={15} /><span><small>Education</small><strong>{education}</strong></span></span>
            <span><BriefcaseBusiness size={15} /><span><small>Experience</small><strong>{profile?.years_experience ?? m1?.metadata?.years_experience ?? 0} years</strong></span></span>
          </div>
          <div className="candidate-resume-status"><span className={hasUserInput ? 'candidate-status-dot is-ready' : 'candidate-status-dot'} />{hasUserInput ? `Analyzed${profile?.resume_filename ? ` · ${profile.resume_filename}` : ''}` : 'Resume not uploaded'}</div>
          <div className="candidate-skill-chips">
            {extractedSkills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}
            {!extractedSkills.length && <span className="candidate-muted-chip">Skills appear after resume analysis</span>}
          </div>
          <a className="candidate-text-link" href="#resume-section">View Resume <ArrowRight size={15} /></a>
        </motion.article>

        <motion.article className="candidate-overview-card candidate-score-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="candidate-card-heading"><span className="candidate-card-icon candidate-icon-violet"><Gauge size={18} /></span><span><small>SELECTED ROLE</small><strong>Overall Match Score</strong></span></div>
          <div className="candidate-score-layout">
            <div className="candidate-score-ring" style={{ '--score': `${displayScore}%` }}><span><strong>{displayScore}%</strong><small>match</small></span></div>
            <div className="candidate-score-copy"><strong>{hasUserInput ? (m2?.fit_level || 'Analyzing') : 'Ready to analyze'}</strong><p>{hasUserInput ? `You match ${m2?.total_matched_skills || 0} of ${m2?.total_required_skills || 0} required skills for ${targetJob?.title || 'this role'}.` : 'Upload your resume to calculate a role-specific score.'}</p><span><span className="candidate-score-dot" />{targetJob?.title || 'Choose a role below'}</span></div>
          </div>
          <a className="candidate-text-link" href="#job-matching">View Detailed Matching <ArrowRight size={15} /></a>
        </motion.article>

        <motion.article id="skills-section" className="candidate-overview-card candidate-skills-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="candidate-card-heading"><span className="candidate-card-icon candidate-icon-cyan"><Zap size={18} /></span><span><small>MODEL 3 COMPARISON</small><strong>Skills Overview</strong></span></div>
          {skillComparisons.length ? <div className="candidate-skill-bars">{skillComparisons.slice(0, 5).map((item) => <div className="candidate-skill-bar" key={item.skill}><div><span>{item.skill}</span><strong>{item.candidateScore}%</strong></div><span className="candidate-bar-track"><i style={{ width: `${item.candidateScore}%` }} /></span></div>)}</div> : <p className="candidate-empty-copy">Run a resume analysis to see your real skill comparison scores.</p>}
          <a className="candidate-text-link" href="#skill-gap-details">View All Skills <ArrowRight size={15} /></a>
        </motion.article>
      </section>

      <section className="candidate-overview-grid candidate-lower-grid">
        <article id="job-listings" className="candidate-overview-card candidate-jobs-card">
          <div className="candidate-section-heading"><div><small>LIVE FROM JOB LISTINGS</small><h2>Recommended Jobs</h2><p>Explore active roles and run a match against your resume.</p></div><a className="candidate-text-link" href="#job-matching">View All Jobs <ArrowRight size={15} /></a></div>
          <div className="candidate-jobs-list">
            {visibleJobs.map((job) => {
              const isSelected = job.id === selectedJobId;
              const jobScore = isSelected && hasUserInput ? m2?.match_score : null;
              return <button key={job.id} className={`candidate-job-row${isSelected ? ' candidate-job-selected' : ''}`} onClick={() => handleJobChange(job.id)}>
                <span className="candidate-job-mark"><BriefcaseBusiness size={18} /></span>
                <span className="candidate-job-copy"><strong>{job.title}</strong><small>{job.company} · {job.location} · {job.job_type || job.experience_level}</small></span>
                <span className="candidate-job-match">{jobScore != null ? <><strong>{Math.round(jobScore)}%</strong><small>Match</small></> : <small>{isSelected ? 'Upload resume' : 'Analyze match'}</small>}</span>
                <ArrowRight size={16} className="candidate-job-arrow" />
              </button>;
            })}
            {!visibleJobs.length && <p className="candidate-empty-copy">No active jobs match that search.</p>}
          </div>
        </article>

        <article className="candidate-overview-card candidate-gaps-card" id="skill-gap-section">
          <div className="candidate-section-heading"><div><small>MODEL 3 ANALYSIS</small><h2>Skill Gap Analysis</h2><p>Key skills to improve for better job opportunities.</p></div><span className="candidate-gap-count">{hasUserInput ? displayCandidateSkillGap : 0} gaps</span></div>
          {hasUserInput && (m3?.severity_chart_data || []).length ? <div className="candidate-gap-list">{m3.severity_chart_data.slice(0, 4).map((item) => <div className="candidate-gap-row" key={item.skill}><span>{item.skill}</span><span className="candidate-gap-track"><i className={`severity-${item.priority?.toLowerCase()}`} style={{ width: `${item.severity}%` }} /></span><strong>{item.priority}</strong></div>)}</div> : <p className="candidate-empty-copy">{hasUserInput ? 'No skill gaps were found for this role.' : 'Upload your resume to identify skills to strengthen.'}</p>}
          <div className="candidate-gap-footer"><p>{focusSkills.length ? `Focus next on ${focusSkills.join(', ')}.` : 'Your personalized focus areas will appear after analysis.'}</p><a className="candidate-text-link" href="#skill-gap-details">View Recommendations <ArrowRight size={15} /></a></div>
        </article>
      </section>

      {/* Persistent User Constraints Panel (Initially 0, Restored on Login) */}
      <section id="settings-section" className="candidate-feature-section">
        <ConstraintsPanel user={user} />
      </section>

      {/* Visual Animated Pipeline Workflow */}
      <section className="candidate-feature-section"><PipelineWorkflow isProcessing={isProcessing} currentStage={8} /></section>

      {/* Resume Upload and Ingestion */}
      <section id="resume-section" className="candidate-feature-section"><ResumeUploader
        onResumeProcessed={handleResumeProcessed}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      /></section>

      {/* Section 1: Model 1 - NLP Extracted Skills Breakdown */}
      <section className="candidate-feature-section"><div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Model 1: NLP Extracted Competencies by Domain
              </h3>
              <p className="text-xs text-slate-400">
                Identified {m1?.skill_count || 0} technical skills using spaCy entity extraction across 6 domains
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-dark-800 px-3 py-1.5 rounded-xl border border-white/5">
            Est. Experience: <b className="text-white">{m1?.metadata?.years_experience ?? profile?.years_experience ?? 0} Years</b>
          </div>
        </div>

        {/* Categorized Badges Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {m1?.categories && Object.entries(m1.categories).map(([category, skillList]) => {
            if (!skillList || skillList.length === 0) return null;
            return (
              <div key={category} className="p-4 rounded-xl bg-dark-800/80 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-white capitalize">
                      {category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                      {skillList.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skillList.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-dark-750 text-slate-200 border border-white/5 hover:border-indigo-500/40 font-mono transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div></section>

      {/* Section 2: Model 2 - Candidate-Job Matching Breakdown */}
      <section id="job-matching" className="candidate-feature-section"><div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-md">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Model 2: Detailed Candidate-Job Overlap Analysis
            </h3>
            <p className="text-xs text-slate-400">
              TF-IDF Vectorized comparison against required and preferred specifications for {targetJob?.title}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Matched Skills Box */}
          <div className="p-5 rounded-xl bg-dark-800/80 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Matched Skills ({m2?.total_matched_skills || 0})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                High Proficiency
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Required Skills Acquired:</p>
                <div className="flex flex-wrap gap-1.5">
                  {m2?.matching_required_skills?.map((s, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-medium border border-emerald-500/20">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              {m2?.matching_preferred_skills && m2.matching_preferred_skills.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Preferred / Bonus Skills:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m2.matching_preferred_skills.map((s, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 font-medium border border-cyan-500/20">
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Missing Skills / Gaps Box */}
          <div className="p-5 rounded-xl bg-dark-800/80 border border-rose-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Missing Role Skills ({m3?.total_gaps || 0})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                Action Required
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Missing Core Requirements (High Priority):</p>
                <div className="flex flex-wrap gap-1.5">
                  {m2?.missing_required_skills?.length > 0 ? (
                    m2.missing_required_skills.map((s, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 font-medium border border-rose-500/20">
                        ! {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium">None! All required skills matched.</span>
                  )}
                </div>
              </div>

              {m2?.missing_preferred_skills && m2.missing_preferred_skills.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Missing Preferred Skills (Moderate Impact):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m2.missing_preferred_skills.map((s, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
                        ~ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div></section>

      {/* Section 3: Model 3 - Interactive Grouped and Horizontal Bar Charts */}
      <section id="skill-gap-details" className="candidate-feature-section"><SkillGapCharts
        groupedData={m3?.grouped_chart_data || []}
        severityData={m3?.severity_chart_data || []}
      />
      </section>

      {/* Section 4: Model 3 - Curated Learning Recommendations */}
      <section id="recommendations-section" className="candidate-feature-section"><CourseRecommendations recommendations={m3?.course_recommendations || []} /></section>

      {/* Section 5: Model 3 - Milestone Career Roadmap */}
      <section id="roadmap-section" className="candidate-feature-section"><CareerRoadmap roadmap={m3?.career_roadmap || []} /></section>

      <section className="candidate-feature-section"><InterviewWorkspace jobId={applications.some(application => application.job_id === selectedJobId) ? selectedJobId : null} /></section>

    </div>
        </main>
      </div>
    </div>
  );
}
