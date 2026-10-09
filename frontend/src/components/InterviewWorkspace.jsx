import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrainCircuit, CheckCircle2, ChevronRight, Clock3, Download, Loader2, Mic, MicOff, Play, Sparkles, Volume2 } from 'lucide-react';
import { api } from '../services/api';

const ROLES = ['Senior ML Engineer', 'Data Scientist', 'Software Engineer', 'Python Developer', 'Data Analyst', 'Full Stack Developer', 'AI Engineer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer'];
const CATEGORIES = [['technical', 'Technical'], ['behavioral', 'Behavioral'], ['scenario', 'Scenario'], ['hr', 'HR']];
const QUESTION_OPTIONS = [3, 5, 10, 15];

export default function InterviewWorkspace({ jobId = null, recruiter = false, candidates = [] }) {
  const [role, setRole] = useState(ROLES[0]);
  const [categories, setCategories] = useState(['technical', 'behavioral']);
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [answer, setAnswer] = useState('');
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState([]);
  const [interviewType, setInterviewType] = useState('voice');
  const [recording, setRecording] = useState(false);
  const [phase, setPhase] = useState('idle');
  const recognitionRef = useRef(null);
  const speechSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const loadSessions = async () => {
    try {
      setSessions((await api.getInterviewSessions()).sessions || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  useEffect(() => {
    if (!startedAt || session?.status === 'completed') return undefined;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, session]);

  const toggleCategory = (value) => {
    setQuestions([]);
    setMessage('');
    setCategories(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const generate = async () => {
    setLoading(true);
    setMessage('');
    setQuestions([]);
    try {
      const payload = (await api.generateInterviewQuestions(role, categories, count)).questions || [];
      if (payload.length !== count) {
        throw new Error(`Expected ${count} questions, received ${payload.length}.`);
      }
      setQuestions(payload);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    if (questions.length !== count) {
      setMessage(`Please generate exactly ${count} questions first.`);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const result = await api.startInterviewSession({ job_role: role, job_id: jobId || undefined, interview_type: interviewType, questions });
      setSession(result.session);
      setQuestions(result.questions || questions);
      setIndex(0);
      setAnswer('');
      setResults([]);
      setPhase('idle');
      setStartedAt(Date.now());
      setElapsed(0);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (complete = false) => {
    const question = questions[index];
    if (!answer || !question || !session) return;
    setLoading(true);
    setPhase('processing');
    setMessage('');
    try {
      const result = await api.submitInterviewResponse(session.id, {
        question_id: question.id,
        question_text: question.question_text,
        candidate_answer: answer,
        complete,
      });

      const response = result.response || {};
      const feedback = response.feedback || {};

      setResults(current => [...current, {
        question: question.question_text,
        selectedAnswer: answer,
        feedback,
      }]);

      setSession(result.session);
      if (result.session.status === 'completed') {
        setPhase('completed');
        await loadSessions();
      } else {
        setPhase('feedback');
        setIndex(current => current + 1);
        setAnswer('');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resumeSession = async (sessionId) => {
    setLoading(true);
    setMessage('');
    try {
      const result = await api.getInterviewSession(sessionId);
      const savedSession = result.session;
      setSession(savedSession);
      setQuestions(savedSession.questions || []);
      setResults((savedSession.responses || []).map(response => ({
        question: response.question_text,
        selectedAnswer: response.candidate_answer,
        feedback: response.feedback || {},
      })));
      setIndex((savedSession.responses || []).length);
      setInterviewType(savedSession.interview_type || 'voice');
      setStartedAt(savedSession.started_at ? new Date(savedSession.started_at).getTime() : null);
      setPhase(savedSession.status === 'completed' ? 'completed' : 'idle');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const startScreening = async (candidate) => {
    setLoading(true);
    setMessage('');
    try {
      const generated = await api.generateInterviewQuestions(role, categories, count);
      const created = await api.startInterviewSession({
        candidate_id: candidate.candidate_id,
        job_id: candidate.job_id,
        job_role: role,
        interview_type: 'voice',
        questions: generated.questions,
      });
      setMessage(`Voice screening created for ${candidate.candidate_name}. They can continue it from their candidate dashboard.`);
      await loadSessions();
      return created.session;
    } catch (error) {
      setMessage(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('Speech recognition is not supported in this browser. You can still type your answer.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = navigator.language || 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = event => {
        const transcript = Array.from(event.results).map(result => result[0].transcript).join(' ');
        setAnswer(transcript);
      };
      recognition.onerror = event => {
        setRecording(false);
        setPhase('idle');
        setMessage(event.error === 'not-allowed'
          ? 'Microphone permission is required to continue.'
          : event.error === 'no-speech'
            ? 'No speech was detected. Please try again or type your answer.'
            : 'Unable to recognize your response. Please try again.');
      };
      recognition.onend = () => {
        setRecording(false);
        setPhase('idle');
      };
      recognitionRef.current = recognition;
      setMessage('');
      setPhase('listening');
      setRecording(true);
      recognition.start();
    } catch {
      setRecording(false);
      setPhase('idle');
      setMessage('Unable to start recording. Check microphone access and try again.');
    }
  };

  const downloadReport = async (sessionId) => {
    try {
      const blob = await api.downloadInterviewReport(sessionId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview_${sessionId}_report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const replayQuestion = (question) => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setMessage('Question audio is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new window.SpeechSynthesisUtterance(question));
  };

  const scoreSummary = useMemo(() => {
    const total = results.length || 0;
    const score = total ? Math.round((results.reduce((sum, item) => sum + Number(item.feedback?.score || 0), 0) / total) * 10) / 10 : 0;
    const strong = results.filter(item => Number(item.feedback?.score || 0) >= 7).length;
    return { total, score, strong, percentage: Math.round(score * 10) };
  }, [results]);

  if (recruiter) {
    return (
      <section className="glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-300 font-bold">Interview & ATS Management</p>
            <h2 className="text-xl font-black text-white mt-1">Voice screening</h2>
            <p className="text-xs text-slate-400 mt-1">Create a role-specific session for an applicant. Candidates complete it from their own account.</p>
          </div>
          <BrainCircuit className="text-cyan-400" />
        </div>

        <div className="grid sm:grid-cols-[minmax(0,1fr)_180px_130px] gap-3 mb-5">
          <label className="text-xs font-bold text-slate-300">Interview role
            <select value={role} onChange={event => setRole(event.target.value)} className="mt-2 w-full rounded-xl bg-dark-800 border border-white/10 p-3 text-sm text-white">
              {ROLES.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-300">Categories
            <select value={categories[0]} onChange={event => setCategories([event.target.value])} className="mt-2 w-full rounded-xl bg-dark-800 border border-white/10 p-3 text-sm text-white">
              {CATEGORIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-300">Questions
            <select value={count} onChange={event => setCount(Number(event.target.value))} className="mt-2 w-full rounded-xl bg-dark-800 border border-white/10 p-3 text-sm text-white">
              {QUESTION_OPTIONS.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-2">
          {candidates.map(candidate => (
            <div key={`${candidate.candidate_id}-${candidate.job_id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-dark-800/70 border border-white/10 p-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{candidate.candidate_name}</p>
                <p className="text-xs text-slate-400 truncate">{candidate.job_applied} · {candidate.candidate_email} · {candidate.status}</p>
              </div>
              <button onClick={() => startScreening(candidate)} disabled={loading} className="flex items-center justify-center gap-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Mic size={14} />} Start voice screening
              </button>
            </div>
          ))}
          {candidates.length === 0 && <p className="text-sm text-slate-400">No applicants for the selected job yet.</p>}
        </div>

        {sessions.length > 0 && <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">Recent sessions</p>
          <div className="grid gap-2">
            {sessions.map(item => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-dark-800/70 border border-white/10 p-3">
                <div>
                  <p className="text-sm font-bold text-white">{item.candidate_name || 'Candidate'} · {item.job_role}</p>
                  <p className="text-xs text-slate-400">{item.responses?.length || 0}/{item.total_questions} answers · {item.score == null ? 'Not evaluated' : `${item.score}/10`}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-cyan-300 uppercase">{item.status}</span>
                  {item.status === 'completed' && <button onClick={() => downloadReport(item.id)} title="Download interview report" className="text-slate-300 hover:text-white"><Download size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>}
        {message && <p role="status" className="mt-4 text-xs font-semibold text-cyan-200">{message}</p>}
      </section>
    );
  }

  const activeQuestion = questions[index];
  const hasGeneratedQuestions = questions.length > 0;

  return (
    <section className="glass-panel rounded-3xl p-6 lg:p-8 border border-indigo-500/20 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold">INTERVIEW PREPARATION</p>
          <h2 className="text-xl lg:text-2xl font-black text-white mt-1">Practice with a role-specific interview</h2>
          <p className="text-xs text-slate-400 mt-2">Practice role-specific questions and test your knowledge.</p>
        </div>
        <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-300"><Sparkles /></div>
      </div>

      {!session && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-xs font-bold text-slate-300">
              Target role
              <select value={role} onChange={event => { setRole(event.target.value); setQuestions([]); setMessage(''); }} className="mt-2 w-full rounded-xl bg-dark-800 border border-white/10 p-3 text-sm text-white">
                {ROLES.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="text-xs font-bold text-slate-300">
              Number of questions
              <select value={count} onChange={event => { setCount(Number(event.target.value)); setQuestions([]); setMessage(''); }} className="mt-2 w-full rounded-xl bg-dark-800 border border-white/10 p-3 text-sm text-white">
                {QUESTION_OPTIONS.map(value => <option key={value} value={value}>{value} Questions</option>)}
              </select>
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-xs font-bold text-slate-300 mb-2">Interview type</legend>
              <div className="inline-flex rounded-xl border border-white/10 bg-dark-800 p-1">
                {[['voice', 'Voice screening'], ['practice', 'Practice']].map(([value, label]) => <button key={value} type="button" aria-pressed={interviewType === value} onClick={() => setInterviewType(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${interviewType === value ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{label}</button>)}
              </div>
              {interviewType === 'voice' && <p className="mt-2 text-[11px] text-slate-500">Speech recognition is provided by your browser. You can review and edit every transcript before submitting.</p>}
            </fieldset>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-300 mb-2">Question categories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleCategory(value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border ${categories.includes(value) ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200' : 'bg-dark-800 border-white/10 text-slate-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={generate} disabled={loading || categories.length === 0} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={15} /> : <BrainCircuit size={15} />} Generate questions
            </button>
            {hasGeneratedQuestions && (
              <button onClick={start} disabled={loading} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white">
                <Play size={15} /> Start interview
              </button>
            )}
          </div>

          {hasGeneratedQuestions && (
            <div className="grid gap-2">
              {questions.map((item, itemIndex) => (
                <div key={`${item.question_text}-${itemIndex}`} className="rounded-xl border border-white/10 bg-dark-800/50 p-3 text-sm text-slate-200">
                  <span className="mr-2 text-xs font-bold text-indigo-300">Q{itemIndex + 1}</span>
                  {item.question_text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {session && session.status === 'completed' && (
        <div className="space-y-6 py-4">
          <div className="text-center py-6">
            <CheckCircle2 className="mx-auto text-emerald-400" size={42} />
            <h3 className="mt-3 text-xl font-black text-white">Interview completed</h3>
            <p className="mt-2 text-sm text-slate-400">Your interview has been evaluated.</p>
          </div>

          <div className="grid sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/10 bg-dark-800/60 p-4">
              <p className="text-[10px] uppercase text-slate-400">Questions Answered</p>
              <p className="mt-2 text-2xl font-black text-white">{scoreSummary.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-[10px] uppercase text-emerald-300">Strong Responses</p>
              <p className="mt-2 text-2xl font-black text-white">{scoreSummary.strong}</p>
            </div>
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
              <p className="text-[10px] uppercase text-rose-300">Overall Score</p>
              <p className="mt-2 text-2xl font-black text-white">{scoreSummary.score}/10</p>
            </div>
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
              <p className="text-[10px] uppercase text-indigo-300">Percentage</p>
              <p className="mt-2 text-2xl font-black text-white">{scoreSummary.percentage}%</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-dark-800/60 p-4">
            <h4 className="text-sm font-bold text-white">Result Summary</h4>
            <p className="mt-2 text-sm text-slate-300">Assessment is based on role relevance, completeness, clarity, and problem-solving structure. Hiring decisions remain with the recruiter.</p>
          </div>

          <div className="space-y-3">
            {results.map((item, idx) => (
              <div key={`${item.question}-${idx}`} className="rounded-2xl border border-white/10 bg-dark-800/60 p-4">
                <p className="text-sm font-bold text-white">Question {idx + 1}</p>
                <p className="mt-2 text-sm text-slate-200">{item.question}</p>
                <p className="mt-2 text-xs text-slate-400">Transcript: <span className="text-white">{item.selectedAnswer}</span></p>
                <p className="mt-2 text-xs font-bold text-cyan-200">Rubric score: {item.feedback?.score || 0}/10</p>
                <p className="mt-1 text-xs text-slate-300">{item.feedback?.feedback}</p>
                <p className="mt-2 text-xs text-emerald-200">Strengths: {(item.feedback?.strengths || []).join(' ')}</p>
                <p className="mt-1 text-xs text-amber-200">Improvements: {(item.feedback?.improvements || []).join(' ')}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => downloadReport(session.id)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white"><Download size={15} /> Download Interview Report</button>
            <button onClick={() => { setSession(null); setQuestions([]); setResults([]); setAnswer(''); setIndex(0); setPhase('idle'); loadSessions(); }} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white">Start another interview</button>
          </div>
        </div>
      )}

      {session && session.status !== 'completed' && activeQuestion && (
        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Question {index + 1} of {questions.length}</span>
              <span className="flex items-center gap-1"><Clock3 size={14} /> {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
            </div>

            <div className="h-2 rounded-full bg-dark-800">
              <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
            </div>

            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase font-bold text-indigo-300">{activeQuestion.category} · {session.interview_type === 'voice' ? 'AI Voice Interview' : 'Practice'}</p>
                <button onClick={() => replayQuestion(activeQuestion.question_text)} title="Replay question" className="text-indigo-200 hover:text-white"><Volume2 size={18} /></button>
              </div>
              <p className="mt-2 text-lg font-bold text-white">{activeQuestion.question_text}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-dark-800/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <label htmlFor="interview-answer" className="text-xs font-bold text-slate-200">Your response</label>
                <div className="flex items-center gap-2">
                  {!recording ? (
                    <button type="button" onClick={startRecording} className="flex items-center gap-2 rounded-lg bg-rose-700 hover:bg-rose-600 px-3 py-2 text-xs font-bold text-white">
                      <Mic size={15} /> {speechSupported ? 'Start recording' : 'Type response'}
                    </button>
                  ) : (
                    <button type="button" onClick={() => recognitionRef.current?.stop()} className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white">
                      <MicOff size={15} /> Stop recording
                    </button>
                  )}
                  <span className={`text-[10px] font-bold uppercase ${recording ? 'text-rose-300' : 'text-slate-500'}`}>{recording ? 'Listening...' : phase === 'processing' ? 'Analyzing...' : phase === 'feedback' ? 'Response evaluated' : 'Idle'}</span>
                </div>
              </div>
              <textarea id="interview-answer" value={answer} onChange={event => setAnswer(event.target.value)} rows={5} placeholder="Speak your answer or type it here. Review the transcript before submitting." className="w-full resize-y rounded-xl border border-white/10 bg-dark-900 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400" />
              <p className="mt-2 text-[11px] text-slate-500">Microphone permission is requested by your browser. You can edit the transcript before submitting.</p>
            </div>

            {results.length > 0 && phase === 'feedback' && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-slate-200">
              <strong className="text-emerald-200">Response evaluated · {results.at(-1)?.feedback?.score || 0}/10</strong>
              <p className="mt-1">{results.at(-1)?.feedback?.feedback}</p>
            </div>}

            <div className="flex justify-end gap-3">
              <button onClick={() => submit(index === questions.length - 1)} disabled={loading || !answer.trim()} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={15} /> : index === questions.length - 1 ? <CheckCircle2 size={15} /> : <ChevronRight size={15} />}
                {loading ? 'Analyzing your response...' : index === questions.length - 1 ? 'Complete Interview' : 'Submit Answer'}
                <ChevronRight size={15} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {message && <p className="mt-4 text-xs font-semibold text-rose-300">{message}</p>}

      {!session && sessions.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">My Interviews</p>
          <div className="grid gap-2">
            {sessions.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-dark-800/60 p-3">
                <div>
                  <span className="text-xs text-slate-200">{item.job_role} <span className="text-slate-500">#{item.id}</span></span>
                  <p className="mt-1 text-[10px] uppercase font-bold text-indigo-300">{item.status}</p>
                </div>
                <button onClick={() => resumeSession(item.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/5">{item.status === 'completed' ? 'Review results' : 'Resume interview'}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
