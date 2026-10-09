import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Users,
  Plus,
  BarChart2,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Loader2,
  Sparkles,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  FileBarChart,
  Activity,
  BookOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConstraintsPanel from '../components/ConstraintsPanel';
import InterviewWorkspace from '../components/InterviewWorkspace';
import './CandidateDashboard.css';

export default function RecruiterDashboard({ user }) {
  const { logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [constraints, setConstraints] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [inspectedCandidate, setInspectedCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [atsStatusFilter, setAtsStatusFilter] = useState('all');
  const [hasRecruiterInput, setHasRecruiterInput] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeNav, setActiveNav] = useState('recruiter-overview');
  const [statusMessage, setStatusMessage] = useState('');

  // Post Job form state
  const [newJob, setNewJob] = useState({
    title: '',
    company: user?.full_name ? `${user.full_name}'s Org` : 'Tech Corp',
    location: 'Remote',
    experience_level: 'Mid-Senior',
    salary_range: '$130,000 - $165,000',
    description: '',
    required_skills: '',
    preferred_skills: ''
  });
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    loadRecruiterData();
  }, []);

  const loadRecruiterData = async () => {
    setLoading(true);
    try {
      const [jobsRes, analyticsRes, stateRes] = await Promise.all([
        api.getJobs(),
        api.getRecruiterAnalytics(),
        api.getUserSavedState().catch(() => null)
      ]);

      const savedState = stateRes?.saved_state || {};
      if (savedState.has_recruiter_input) {
        setHasRecruiterInput(true);
      }

      if (jobsRes.jobs && jobsRes.jobs.length > 0) {
        setJobs(jobsRes.jobs);
        const targetJob = (savedState.selected_job_id && jobsRes.jobs.find(j => j.id === savedState.selected_job_id))
          || jobsRes.jobs[0];
        setSelectedJob(targetJob);
        await loadCandidatesForJob(targetJob.id);
      }

      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }
    } catch (err) {
      console.error("Recruiter load error", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidatesForJob = async (jobId) => {
    setLoadingCandidates(true);
    try {
      const res = await api.matchCandidatesForJob(jobId);
      if (res.candidates) {
        setCandidates(res.candidates);
      }
    } catch (err) {
      console.error("Candidate match error", err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const updateCandidateStatus = async (candidate, status) => {
    setStatusMessage('');
    try {
      await api.updateAtsCandidateStatus(candidate.candidate_id, status);
      setCandidates(current => current.map(item => item.candidate_id === candidate.candidate_id ? { ...item, status } : item));
      setInspectedCandidate(current => current?.candidate_id === candidate.candidate_id ? { ...current, status } : current);
      setAnalytics(await api.getRecruiterAnalytics());
      setStatusMessage(`${candidate.candidate_name}'s ATS status is now ${status}.`);
    } catch (error) {
      setStatusMessage(error.message || 'Unable to update ATS status.');
    }
  };

  const downloadMatchingReport = async (candidate) => {
    try {
      const blob = await api.downloadMatchReport(selectedJob?.id, candidate.candidate_id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidate.candidate_name.replace(/\s+/g, '_')}_match_report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setStatusMessage(error.message || 'Unable to download the match report.');
    }
  };

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    setHasRecruiterInput(true);
    api.updateUserSavedState({ has_recruiter_input: true, selected_job_id: job.id }).catch(() => {});
    await loadCandidatesForJob(job.id);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.description) return;
    setIsPosting(true);
    try {
      const reqSkills = newJob.required_skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const prefSkills = newJob.preferred_skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await api.createJob({
        ...newJob,
        required_skills: reqSkills,
        preferred_skills: prefSkills
      });

      if (res.job) {
        setJobs(prev => [res.job, ...prev]);
        setSelectedJob(res.job);
        setHasRecruiterInput(true);
        api.updateUserSavedState({ has_recruiter_input: true, selected_job_id: res.job.id }).catch(() => {});
        setShowPostModal(false);
        setNewJob({
          title: '',
          company: 'Tech Corp',
          location: 'Remote',
          experience_level: 'Mid-Senior',
          salary_range: '$130,000 - $165,000',
          description: '',
          required_skills: '',
          preferred_skills: ''
        });
        await loadCandidatesForJob(res.job.id);
      }
    } catch (err) {
      console.error("Job creation failed", err);
    } finally {
      setIsPosting(false);
    }
  };

  let filteredCandidates = candidates.filter(c => {
    const matchesSearch = (c.candidate_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.headline || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.candidate_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.extracted_skills || []).some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (atsStatusFilter !== 'all' && c.status !== atsStatusFilter) return false;

    // Apply persistent user matching constraints
    if (constraints.min_candidate_score && c.match_score < constraints.min_candidate_score) {
      return false;
    }
    if (constraints.min_years_experience && c.years_experience < constraints.min_years_experience) {
      return false;
    }
    if (constraints.min_matched_skills && (c.matching_required_skills?.length || 0) < constraints.min_matched_skills) {
      return false;
    }
    return true;
  });

  if (constraints.max_pool_size && constraints.max_pool_size > 0) {
    filteredCandidates = filteredCandidates.slice(0, constraints.max_pool_size);
  }

  // Calculate metrics across applicant pool
  const recruiterName = user?.full_name || 'Recruiter';
  const skillAnalytics = [...new Set([...(analytics?.top_candidate_skills || []).map(item => item.skill), ...(analytics?.top_demanded_skills || []).map(item => item.skill)])].slice(0, 10).map(skill => ({
    skill,
    candidateCount: analytics?.top_candidate_skills?.find(item => item.skill === skill)?.count || 0,
    requiredCount: analytics?.top_demanded_skills?.find(item => item.skill === skill)?.demand || 0,
  }));
  const matchingDistribution = analytics?.matching_distribution || [];
  const skillGapSeverity = Object.entries(analytics?.skill_gap_severity || {}).map(([severity, count]) => ({ severity, count }));
  const navigationItems = [
    { label: 'Dashboard', id: 'recruiter-overview', icon: LayoutDashboard },
    { label: 'Job Postings', id: 'job-postings', icon: Briefcase },
    { label: 'Applicants', id: 'candidate-pool', icon: Users },
    { label: 'Skill Analytics', id: 'analytics-section', icon: Activity },
    { label: 'Reports', id: 'candidate-pool', icon: FileBarChart },
    { label: 'Interview Workspace', id: 'interview-section', icon: BookOpen }
  ];

  return (
    <div className={`candidate-dashboard recruiter-dashboard${isDarkMode ? ' candidate-dashboard-dark' : ''}`}>
      {mobileNavOpen && <button className="candidate-mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`candidate-sidebar${mobileNavOpen ? ' candidate-sidebar-open' : ''}`}>
        <a href="#recruiter-overview" className="candidate-brand" onClick={() => setMobileNavOpen(false)}>
          <span className="candidate-brand-mark"><Sparkles size={19} /></span>
          <span><strong>SkillMatch<span>.AI</span></strong><small>Talent intelligence</small></span>
        </a>
        <button className="candidate-sidebar-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={18} /></button>
        <p className="candidate-nav-label">Recruiter workspace</p>
        <nav className="candidate-nav" aria-label="Recruiter dashboard navigation">
          {navigationItems.map(({ label, id, icon: Icon }) => (
            <a key={`${label}-${id}`} href={`#${id}`} className={activeNav === id ? 'candidate-nav-active' : ''} aria-current={activeNav === id ? 'page' : undefined} onClick={() => { setMobileNavOpen(false); setActiveNav(id); }}>
              <Icon size={17} /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="candidate-sidebar-spacer" />
        <a href="#settings-section" className="candidate-settings-link" onClick={() => setMobileNavOpen(false)}><Settings size={17} /><span>Settings</span></a>
        <div className="candidate-sidebar-note"><span className="candidate-note-icon"><ShieldCheck size={16} /></span><span><strong>Applicant data protected</strong><small>Recruiter access verified</small></span></div>
      </aside>

      <div className="candidate-main">
        <header className="candidate-topbar">
          <button className="candidate-icon-button candidate-mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button>
          <label className="candidate-search"><Search size={17} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search candidates, roles, or skills..." /><kbd>Ctrl K</kbd></label>
          <div className="candidate-topbar-actions">
            <button className="candidate-icon-button" aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setIsDarkMode((value) => !value)}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            <div className="candidate-popover-anchor">
              <button className="candidate-icon-button candidate-notification-button" aria-label="Recruiter activity" aria-expanded={showNotifications} onClick={() => setShowNotifications((value) => !value)}><Bell size={18} /><span /></button>
              {showNotifications && <div className="candidate-popover"><strong>Hiring activity</strong><p>{analytics?.total_applications || 0} applications across {jobs.length} active job postings.</p></div>}
            </div>
            <div className="candidate-popover-anchor">
              <button className="candidate-user-button" aria-expanded={showUserMenu} onClick={() => setShowUserMenu((value) => !value)}><span className="candidate-avatar">{recruiterName.charAt(0).toUpperCase()}</span><span className="candidate-user-copy"><strong>{recruiterName}</strong><small>Recruiter</small></span><ChevronDown size={15} /></button>
              {showUserMenu && <div className="candidate-popover candidate-user-menu"><strong>{recruiterName}</strong><p>{user?.email || 'Recruiter account'}</p><button onClick={logout}><LogOut size={15} /> Sign out</button></div>}
            </div>
          </div>
        </header>

        <main className="candidate-content" aria-busy={loading}>
    <div id="recruiter-overview" className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                Recruiter Talent Suite
              </span>
              <span className="text-xs text-slate-400">AI-Powered Applicant Matching & Analytics</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {recruiterName.split(' ')[0]}
            </h1>
            <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight mt-1">Talent Pipeline & Job Management</h2>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
              {hasRecruiterInput
                ? "Rank applicants using Model 2 (TF-IDF + Cosine Similarity), identify talent pool skill gaps, and explore candidate competencies in real time."
                : "Initial state active: Recruiter Skill Gap and Moderate Match start at 0. Adjust constraints or evaluate candidates to calculate."}
            </p>
          </div>

          {/* Action Button: Post New Job */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowPostModal(true); setHasRecruiterInput(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Post New Job
            </button>
          </div>
        </div>

        {/* Analytics Snapshot Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Candidates</p>
            <p className="text-2xl font-black text-white mt-0.5">{analytics?.total_candidates ?? 0}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Screened</p>
            <p className="text-2xl font-black text-white mt-0.5">{analytics?.candidates_screened ?? 0}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shortlisted</p>
            <p className="text-2xl font-black text-cyan-400 mt-0.5">{analytics?.candidates_shortlisted ?? 0}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interviews</p>
            <p className="text-2xl font-black text-white mt-0.5">{analytics?.interviews_scheduled ?? 0}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-black text-white mt-0.5">{analytics?.interviews_completed ?? 0}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Selected</p>
            <p className="text-2xl font-black text-white mt-0.5">{analytics?.selected_candidates ?? 0}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">Rejected</p>
            <p className="text-2xl font-black text-white mt-0.5">{analytics?.rejected_candidates ?? 0}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg. Match</p>
            <p className="text-2xl font-black text-white mt-0.5">{analytics?.average_match_score ?? 0}%</p>
          </div>
        </div>

        {/* Informative notification when initial state is 0 */}
        {!hasRecruiterInput && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cyan-300">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <b>Initial Assessment:</b> Recruiter Skill Gap and Moderate Match are currently <b>0</b>. Adjust constraints, filter applicants, or click below to calculate.
              </span>
            </div>
            <button
              onClick={() => {
                setHasRecruiterInput(true);
                api.updateUserSavedState({ has_recruiter_input: true, selected_job_id: selectedJob?.id }).catch(() => {});
              }}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition-all shrink-0 cursor-pointer"
            >
              Evaluate Talent Pool
            </button>
          </div>
        )}
      </div>

      {/* Persistent Recruiter Constraints Panel (Initially 0, Restored on Login) */}
      <section id="settings-section" className="candidate-feature-section"><ConstraintsPanel
        user={user}
        onConstraintsChange={(newConstraints) => {
          setConstraints(newConstraints);
          const hasNonZero = Object.values(newConstraints || {}).some(v => Number(v) > 0);
          if (hasNonZero) {
            setHasRecruiterInput(true);
            api.updateUserSavedState({ has_recruiter_input: true, selected_job_id: selectedJob?.id }).catch(() => {});
          }
        }}
      /></section>

      {/* Main Grid: Job Selector on Left, Candidates on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Job Postings List (4 cols) */}
        <div id="job-postings" className="lg:col-span-4 space-y-3 candidate-feature-section">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              Active Job Postings ({jobs.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {jobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'glass-panel-glow border-indigo-500/60 bg-dark-750/90'
                      : 'glass-card border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {job.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">{job.company} • {job.location}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-dark-800 text-slate-300 border border-white/10 shrink-0">
                      {job.experience_level}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {job.required_skills?.slice(0, 4).map((s, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                        {s}
                      </span>
                    ))}
                    {job.required_skills?.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
                        +{job.required_skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Candidate Matching Table (8 cols) */}
        <div id="candidate-pool" className="lg:col-span-8 space-y-4 candidate-feature-section">
          
          {/* Selected Job Header Card */}
          {selectedJob && (
            <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">{selectedJob.title}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedJob.company} • {selectedJob.location} • <span className="text-emerald-400 font-semibold">{selectedJob.salary_range}</span>
                  </p>
                </div>

                {/* Candidate Search */}
                <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setHasRecruiterInput(true);
                    }}
                    placeholder="Filter candidates..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-dark-800 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-48"
                  />
                </div>
                <select aria-label="Filter applicants by ATS status" value={atsStatusFilter} onChange={event => setAtsStatusFilter(event.target.value)} className="rounded-xl bg-dark-800 border border-white/10 px-2.5 py-2 text-xs text-white">
                  <option value="all">All statuses</option>
                  {['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interview In Progress', 'Interview Completed', 'Selected', 'Rejected'].map(status => <option key={status}>{status}</option>)}
                </select>
                </div>
              </div>

              {/* Required & Preferred Skills Pills */}
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold">Required:</span>
                {selectedJob.required_skills?.map((s, idx) => (
                  <span key={idx} className="text-[10.5px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Candidates Match Ranking List */}
          <div className="glass-panel rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Model 2 Ranked Applicants ({filteredCandidates.length})
              </h3>
              <span className="text-[11px] text-slate-400">Sorted by TF-IDF & Skill Match Score</span>
            </div>

            {loadingCandidates ? (
              <div className="p-12 flex flex-col items-center justify-center text-center text-slate-400">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin mb-2" />
                <p className="text-xs font-medium">Calculating Model 2 Vector Matches...</p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No candidates found matching the search filter.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredCandidates.map((cand, idx) => {
                  const score = cand.match_score;
                  const isTop = idx === 0;

                  return (
                    <div
                      key={cand.candidate_id}
                      className="p-4 hover:bg-dark-750/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isTop
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-dark-800 text-slate-400 border border-white/10'
                        }`}>
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                              {cand.candidate_name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-800 text-slate-300 border border-white/5">
                              {cand.years_experience} yrs exp
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{cand.headline}</p>

                          {/* Skill overlap counters */}
                          <div className="mt-2 flex items-center gap-3 text-[11px]">
                            <span className="text-emerald-400 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {cand.matching_required_skills?.length || 0} Matched
                            </span>
                            <span className="text-rose-400 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              {cand.missing_required_skills?.length || 0} Gaps
                            </span>
                            <span className="text-slate-400 hidden md:inline">
                              Semantic: <b className="text-slate-200">{cand.semantic_similarity}%</b>
                            </span>
                          </div>
                          <p className="mt-2 text-[10px] text-slate-400">Applied: {cand.job_applied} · ATS: <span className="text-cyan-200">{cand.status}</span>{cand.interview_status ? ` · Interview: ${cand.interview_status}` : ''}</p>
                        </div>
                      </div>

                      {/* Right: Match Score & Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-base font-extrabold text-white">{score}%</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              score >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                              score >= 65 ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {cand.fit_level}
                            </span>
                          </div>
                          
                          {/* Mini progress bar */}
                          <div className="w-24 h-1.5 bg-dark-700 rounded-full mt-1 overflow-hidden ml-auto">
                            <div
                              className={`h-full ${
                                score >= 80 ? 'bg-emerald-400' : score >= 65 ? 'bg-cyan-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setInspectedCandidate(cand);
                            setHasRecruiterInput(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-indigo-600 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Recruiter Skill Analytics Section */}
      <div id="analytics-section" className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl candidate-feature-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Recruitment Analytics
              </h3>
              <p className="text-xs text-slate-400">
                Application, matching, skill-gap, and ATS activity for your job postings
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-300 mb-3">Candidate skills vs required skills</h4>
            <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={skillAnalytics} margin={{ top: 5, right: 8, left: -18, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} /><XAxis dataKey="skill" stroke="#94A3B8" fontSize={10} tickLine={false} angle={-20} textAnchor="end" /><YAxis stroke="#94A3B8" fontSize={10} allowDecimals={false} /><Tooltip /><Bar name="Candidates" dataKey="candidateCount" fill="#06B6D4" radius={[4, 4, 0, 0]} /><Bar name="Required" dataKey="requiredCount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart></ResponsiveContainer></div>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-300 mb-3">Skill gap severity</h4>
            <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={skillGapSeverity} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} /><XAxis type="number" stroke="#94A3B8" fontSize={10} allowDecimals={false} /><YAxis dataKey="severity" type="category" stroke="#94A3B8" fontSize={10} width={65} /><Tooltip /><Bar dataKey="count" name="Skill gaps" fill="#F97316" radius={[0, 4, 4, 0]} />
            </BarChart></ResponsiveContainer></div>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-300 mb-3">Candidate matching scores</h4>
            <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={matchingDistribution} margin={{ top: 5, right: 8, left: -18, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} /><XAxis dataKey="candidate_id" stroke="#94A3B8" fontSize={10} tickFormatter={value => `#${value}`} /><YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={10} /><Tooltip labelFormatter={value => `Candidate #${value}`} /><Bar dataKey="score" name="Match score (%)" fill="#34D399" radius={[4, 4, 0, 0]} />
            </BarChart></ResponsiveContainer></div>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-300 mb-3">Recruitment funnel</h4>
            <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics?.recruitment_funnel || []} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} /><XAxis type="number" stroke="#94A3B8" fontSize={10} allowDecimals={false} /><YAxis dataKey="stage" type="category" stroke="#94A3B8" fontSize={10} width={75} /><Tooltip /><Bar dataKey="count" name="Applications" fill="#818CF8" radius={[0, 4, 4, 0]} />
            </BarChart></ResponsiveContainer></div>
          </div>
        </div>
      </div>

      {/* Post New Job Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  Create New Job Posting
                </h3>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lead Platform Engineer"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Company *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Tech"
                      value={newJob.company}
                      onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Location</label>
                    <input
                      type="text"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Salary Range</label>
                    <input
                      type="text"
                      value={newJob.salary_range}
                      onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Job Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe role responsibilities, tech stack, and goals..."
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Required Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="React, TypeScript, Node.js, PostgreSQL, Docker"
                    value={newJob.required_skills}
                    onChange={(e) => setNewJob({ ...newJob, required_skills: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Preferred / Bonus Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="AWS, Kubernetes, Redis, GraphQL"
                    value={newJob.preferred_skills}
                    onChange={(e) => setNewJob({ ...newJob, preferred_skills: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPosting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                  >
                    {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Publish Job & Rank Pool
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inspected Candidate Deep-Dive Modal */}
      <AnimatePresence>
        {inspectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white">{inspectedCandidate.candidate_name}</h3>
                  <p className="text-xs text-slate-400">{inspectedCandidate.candidate_email} • {inspectedCandidate.headline}</p>
                </div>
                <button
                  onClick={() => setInspectedCandidate(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Match overview */}
              <div className="p-4 rounded-xl bg-dark-800 border border-white/5 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Evaluated against <b className="text-white">{selectedJob?.title}</b></p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">{inspectedCandidate.match_score}% Match Score</p>
                  <p className="text-[11px] text-slate-400 mt-1">Interview: {inspectedCandidate.interview_status || 'Not started'}{inspectedCandidate.interview_score != null ? ` · ${inspectedCandidate.interview_score}/10` : ''}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <select aria-label="Update applicant ATS status" value={inspectedCandidate.status || 'Applied'} onChange={event => updateCandidateStatus(inspectedCandidate, event.target.value)} className="rounded-lg bg-dark-900 border border-white/10 px-2.5 py-2 text-xs text-white">
                    {['Applied', 'Screening', 'Interview', 'Interview In Progress', 'Interview Completed', 'Selected', 'Rejected'].map(status => <option key={status}>{status}</option>)}
                  </select>
                  {inspectedCandidate.interview_session_id && inspectedCandidate.interview_status === 'completed' && <button onClick={async () => {
                    try {
                      const blob = await api.downloadInterviewReport(inspectedCandidate.interview_session_id);
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `interview_${inspectedCandidate.interview_session_id}_report.pdf`;
                      link.click();
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      setStatusMessage(error.message);
                    }
                  }} className="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold"><Download className="w-3.5 h-3.5 inline mr-1" />Interview report</button>}
                  <button onClick={() => downloadMatchingReport(inspectedCandidate)} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"><Download className="w-3.5 h-3.5" />Match report</button>
                </div>
              </div>

              {statusMessage && <p role="status" className="mb-3 text-xs text-cyan-200">{statusMessage}</p>}
              <div className="grid sm:grid-cols-3 gap-3 mb-4 text-xs">
                <div className="rounded-lg bg-dark-800/70 p-3"><span className="text-slate-400">Email</span><p className="mt-1 text-white break-all">{inspectedCandidate.candidate_email}</p></div>
                <div className="rounded-lg bg-dark-800/70 p-3"><span className="text-slate-400">Experience</span><p className="mt-1 text-white">{inspectedCandidate.years_experience || 0} years</p></div>
                <div className="rounded-lg bg-dark-800/70 p-3"><span className="text-slate-400">Education</span><p className="mt-1 text-white">{Array.isArray(inspectedCandidate.education) ? inspectedCandidate.education.join(', ') || 'Not listed' : inspectedCandidate.education || 'Not listed'}</p></div>
              </div>
              <details className="mb-4 rounded-xl border border-white/10 bg-dark-800/50 p-3">
                <summary className="cursor-pointer text-xs font-bold text-slate-200">View resume text</summary>
                <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">{inspectedCandidate.resume_text || 'No resume text has been uploaded.'}</pre>
              </details>

              {/* Skill Overlap Breakdown */}
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs font-bold text-emerald-400 mb-1.5">Matched Required Skills:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedCandidate.matching_required_skills?.map((s, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-rose-400 mb-1.5">Missing Required Skills:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedCandidate.missing_required_skills?.length > 0 ? (
                      inspectedCandidate.missing_required_skills.map((s, idx) => (
                        <span key={idx} className="text-xs px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                          ! {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-400">Complete match! No missing required skills.</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-indigo-400 mb-1.5">All Extracted Resume Skills:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedCandidate.extracted_skills?.map((s, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded bg-dark-750 text-slate-300 border border-white/5 font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-dark-800/60 p-3">
                    <p className="text-xs font-bold text-slate-200 mb-1">Certifications</p>
                    <p className="text-xs text-slate-400">{(inspectedCandidate.certifications || []).join(', ') || 'Not listed in parsed resume'}</p>
                  </div>
                  <div className="rounded-xl bg-dark-800/60 p-3">
                    <p className="text-xs font-bold text-slate-200 mb-1">Projects</p>
                    <p className="text-xs text-slate-400">{(inspectedCandidate.projects || []).join(', ') || 'Not listed in parsed resume'}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-dark-800/60 p-3">
                  <p className="text-xs font-bold text-amber-200 mb-2">Skill gap recommendations</p>
                  {(inspectedCandidate.skill_gap_analysis?.severity_chart_data || []).length ? <div className="grid gap-1.5">
                    {inspectedCandidate.skill_gap_analysis.severity_chart_data.slice(0, 5).map(gap => <p key={gap.skill} className="text-xs text-slate-300">{gap.skill} · {gap.priority} priority · {gap.timeToMaster}</p>)}
                    {(inspectedCandidate.skill_gap_analysis.course_recommendations || []).slice(0, 3).map(course => <a key={`${course.skill}-${course.title}`} href={course.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-300 hover:text-white">{course.skill}: {course.title}</a>)}
                  </div> : <p className="text-xs text-slate-400">No skill gaps from the current job match.</p>}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setInspectedCandidate(null)}
                  className="px-4 py-1.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-xs font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <section id="interview-section" className="candidate-feature-section"><InterviewWorkspace candidates={filteredCandidates} recruiter /></section>

    </div>
        </main>
      </div>
    </div>
  );
}
