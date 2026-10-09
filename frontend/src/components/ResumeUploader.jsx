import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function ResumeUploader({ onResumeProcessed, isProcessing, setIsProcessing }) {
  const [activeMode, setActiveMode] = useState('upload'); // 'upload', 'paste', 'samples'
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [sampleResumes, setSampleResumes] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const fileInputRef = useRef(null);

  const fetchSamples = async () => {
    if (sampleResumes.length > 0) return;
    setLoadingSamples(true);
    try {
      const res = await api.getSampleResumes();
      if (res.samples) setSampleResumes(res.samples);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file) => {
    setFileName(file.name);
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.uploadResume(formData, true);
      if (res.extraction) {
        onResumeProcessed(res);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    setFileName("Custom_Resume.txt");

    try {
      const res = await api.uploadResume({ text: pastedText, filename: "Custom_Resume.txt" }, false);
      if (res.extraction) {
        onResumeProcessed(res);
      }
    } catch (err) {
      console.error("Paste upload failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async (sample) => {
    setIsProcessing(true);
    setFileName(`${sample.name.replace(' ', '_')}_Resume.txt`);
    try {
      const res = await api.uploadResume({ text: sample.text, filename: `${sample.name}_Resume.txt` }, false);
      if (res.extraction) {
        onResumeProcessed(res);
      }
    } catch (err) {
      console.error("Sample upload failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
      
      {/* Top Selector Tabs */}
      <div className="flex items-center justify-between gap-4 mb-5 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-400" />
            Resume Ingestion & Model 1 Parser
          </h3>
          <p className="text-xs text-slate-400">PDF, DOCX, direct text, or 1-click curated candidate profiles</p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-dark-800 border border-white/5 text-xs">
          <button
            onClick={() => setActiveMode('upload')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeMode === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            File Upload
          </button>
          <button
            onClick={() => setActiveMode('paste')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeMode === 'paste' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      {/* Mode 1: Drag and Drop File Upload */}
      {activeMode === 'upload' && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
              dragOver
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                : 'border-white/10 hover:border-indigo-500/50 hover:bg-dark-800/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
              {isProcessing ? (
                <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
              ) : (
                <FileText className="w-7 h-7" />
              )}
            </div>

            <p className="text-sm font-semibold text-white">
              {fileName ? fileName : "Drop your resume here, or browse files"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF, DOCX, DOC and TXT formats (up to 15MB)
            </p>

            {isProcessing && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Sparkles className="w-4 h-4 animate-spin" />
                Executing Model 1: NLP Entity Extraction & Categorization...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Paste Raw Resume Text */}
      {activeMode === 'paste' && (
        <div className="space-y-3">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={5}
            placeholder="Paste your raw resume text here (Summary, Technical Skills, Experience, Education)..."
            className="w-full rounded-xl bg-dark-800/90 border border-white/10 p-3.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70 font-mono"
          />
          <button
            onClick={handlePasteSubmit}
            disabled={isProcessing || !pastedText.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing with Model 1...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extract Skills & Run Model 1
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
