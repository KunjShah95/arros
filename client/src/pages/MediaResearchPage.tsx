/**
 * MediaResearchPage — PDF & YouTube Research Interface
 *
 * Three modes:
 *  1. PDF Upload — drag & drop or file picker → analyze with brain
 *  2. YouTube URL → fetch transcript → analyze → generate flashcards
 *  3. Results display (shared with ResearchWorkspace format)
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Youtube, Upload, X, Brain, CheckCircle2,
    BookOpen, Lightbulb, HelpCircle, Zap, ExternalLink,
    ChevronDown, ChevronUp, AlertCircle, Loader2,
} from 'lucide-react';
import { cn } from '../components/ui';

// ─── API helpers ──────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '/api';

async function analyzePDF(file: File) {
    const form = new FormData();
    form.append('file', file);
    const r = await fetch(`${API}/media/pdf`, { method: 'POST', body: form });
    if (!r.ok) throw new Error((await r.json()).error || 'Failed to analyze PDF');
    return r.json();
}

async function analyzeYouTube(url: string) {
    const r = await fetch(`${API}/media/youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });
    if (!r.ok) throw new Error((await r.json()).error || 'Failed to analyze video');
    return r.json();
}

async function generateFlashcards(sessionId: string, topic: string) {
    const r = await fetch(`${API}/flashcards/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, topic }),
    });
    return r.json();
}

// ─── ResultView ───────────────────────────────────────────────────────────────

function ResultView({ result, onGenerateFlashcards }: { result: any; onGenerateFlashcards: () => void }) {
    const [showQuestions, setShowQuestions] = useState(false);
    const [flashcardsGenerated, setFlashcardsGenerated] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await generateFlashcards(result.sessionId, result.topics?.[0] || result.title);
            setFlashcardsGenerated(true);
        } catch (e) {
            console.error(e);
        }
        setGenerating(false);
    };

    const confidencePct = Math.round(result.confidence * 100);
    const difficultyColor = { beginner: 'text-peacock', intermediate: 'text-gold', advanced: 'text-saffron' }[result.difficulty as string] || 'text-ash';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
        >
            {/* Header card */}
            <div className="cut-card glass-premium border border-peacock/30 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-chalk">{result.title}</h2>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className={cn('text-[11px] font-medium uppercase tracking-wider', difficultyColor)}>{result.difficulty}</span>
                            <span className="text-ash/40">·</span>
                            <span className="text-[11px] text-ash">{result.wordCount.toLocaleString()} words</span>
                            <span className="text-ash/40">·</span>
                            <span className="text-[11px] text-peacock">{confidencePct}% confidence</span>
                        </div>
                    </div>
                    <div className={cn('w-12 h-12 cut-card flex items-center justify-center flex-shrink-0', result.mediaType === 'pdf' ? 'bg-saffron/10 border border-saffron/30' : 'bg-error/10 border border-error/30')}>
                        {result.mediaType === 'pdf' ? <FileText className="w-6 h-6 text-saffron" /> : <Youtube className="w-6 h-6 text-error" />}
                    </div>
                </div>

                {/* Topics */}
                {result.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {result.topics.map((t: string) => (
                            <span key={t} className="text-[10px] px-2 py-1 cut-card bg-graphite/50 border border-smoke/30 text-ash">{t}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="cut-card border border-smoke/40 p-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-ash mb-3 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    Summary
                </div>
                <p className="text-sm text-silver leading-relaxed">{result.summary}</p>
            </div>

            {/* Key Findings + Takeaways side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="cut-card border border-smoke/40 p-5">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-ash mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-peacock" />
                        Key Findings
                    </div>
                    <ul className="space-y-2">
                        {result.keyFindings.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-silver">
                                <span className="text-peacock font-mono text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="cut-card border border-smoke/40 p-5">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-ash mb-3 flex items-center gap-2">
                        <Lightbulb className="w-3 h-3 text-gold" />
                        Key Takeaways
                    </div>
                    <ul className="space-y-2">
                        {result.keyTakeaways.map((t: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-silver">
                                <span className="text-gold font-mono text-xs mt-0.5">→</span>
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Open Questions */}
            {result.questions?.length > 0 && (
                <div className="cut-card border border-smoke/40 p-5">
                    <button
                        onClick={() => setShowQuestions(!showQuestions)}
                        className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-ash hover:text-chalk transition-colors"
                    >
                        <span className="flex items-center gap-2"><HelpCircle className="w-3 h-3" /> Study Questions ({result.questions.length})</span>
                        {showQuestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <AnimatePresence>
                        {showQuestions && (
                            <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 space-y-2 overflow-hidden"
                            >
                                {result.questions.map((q: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-silver">
                                        <span className="text-saffron font-mono text-xs mt-0.5">?</span>
                                        {q}
                                    </li>
                                ))}
                            </motion.ul>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Generate Flashcards CTA */}
            <div className="cut-card bg-peacock/5 border border-peacock/30 p-5 flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-chalk">Generate Flashcards from this Content</p>
                    <p className="text-xs text-ash mt-0.5">Brain will create SM-2 optimized study cards automatically</p>
                </div>
                {flashcardsGenerated ? (
                    <div className="flex items-center gap-2 text-peacock text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        Cards Generated!
                    </div>
                ) : (
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="cut-card bg-peacock/20 border border-peacock/40 text-peacock px-5 py-2.5 text-sm font-medium hover:bg-peacock/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {generating ? 'Generating...' : 'Generate Flashcards'}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MediaResearchPage() {
    const [activeTab, setActiveTab] = useState<'pdf' | 'youtube'>('pdf');
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (f: File) => {
        if (!f.name.endsWith('.pdf') && f.type !== 'application/pdf') {
            setError('Please upload a PDF file');
            return;
        }
        setFile(f);
        setError('');
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    }, []);

    const handleAnalyze = async () => {
        setError('');
        setResult(null);
        setLoading(true);
        try {
            if (activeTab === 'pdf') {
                if (!file) { setError('Please select a PDF file'); setLoading(false); return; }
                const res = await analyzePDF(file);
                setResult(res);
            } else {
                if (!youtubeUrl.trim()) { setError('Please enter a YouTube URL'); setLoading(false); return; }
                const res = await analyzeYouTube(youtubeUrl.trim());
                setResult(res);
            }
        } catch (e: any) {
            setError(e.message || 'Analysis failed');
        }
        setLoading(false);
    };

    return (
        <div className="h-full flex flex-col overflow-y-auto px-6 py-6 space-y-6" style={{ backgroundColor: '#FAFAFA' }}>
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Media Research</h1>
                <p className="text-sm mt-0.5" style={{ color: '#666' }}>Let your brain analyze PDFs and YouTube videos</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 cut-card bg-graphite/40 border border-smoke/30 w-fit">
                {(['pdf', 'youtube'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setResult(null); setError(''); setFile(null); }}
                        className={cn(
                            'flex items-center gap-2 px-5 py-2 text-sm font-medium transition-all cut-card',
                            activeTab === tab ? 'bg-peacock/20 text-peacock border border-peacock/40' : 'text-ash hover:text-chalk'
                        )}
                    >
                        {tab === 'pdf' ? <FileText className="w-4 h-4" /> : <Youtube className="w-4 h-4" />}
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Input area */}
            {!result && (
                <div className="space-y-4">
                    {activeTab === 'pdf' ? (
                        <>
                            {/* Dropzone */}
                            <div
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    'cut-card border-2 border-dashed p-12 text-center cursor-pointer transition-all',
                                    isDragging ? 'border-peacock/60 bg-peacock/10' : 'border-smoke/40 hover:border-peacock/40 hover:bg-peacock/5'
                                )}
                            >
                                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                                {file ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <FileText className="w-12 h-12 text-saffron" />
                                        <p className="text-chalk font-medium">{file.name}</p>
                                        <p className="text-ash text-sm">{(file.size / 1024).toFixed(0)} KB</p>
                                        <button onClick={e => { e.stopPropagation(); setFile(null); }} className="text-error/70 hover:text-error text-xs flex items-center gap-1">
                                            <X className="w-3 h-3" /> Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <Upload className="w-12 h-12 text-ash/40" />
                                        <p className="text-chalk">Drop a PDF here or click to browse</p>
                                        <p className="text-ash text-sm">Max 20MB · PDF format only</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="cut-card border border-smoke/40 p-5 flex flex-col gap-4">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-ash flex items-center gap-2">
                                    <Youtube className="w-3 h-3 text-error" />
                                    YouTube URL
                                </label>
                                <input
                                    type="url"
                                    value={youtubeUrl}
                                    onChange={e => setYoutubeUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="bg-graphite/50 border border-smoke/40 text-chalk px-4 py-3 text-sm cut-card focus:outline-none focus:border-peacock/50 placeholder:text-ash/40 w-full"
                                />
                                <p className="text-[11px] text-ash">The brain will fetch the transcript and analyze content. If no transcript is available, it will analyze based on what it can infer.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-error text-sm cut-card bg-error/10 border border-error/30 px-4 py-3">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={loading || (activeTab === 'pdf' ? !file : !youtubeUrl)}
                        className="cut-card bg-peacock/20 border border-peacock/40 text-peacock px-6 py-3 font-medium text-sm hover:bg-peacock/30 transition-all flex items-center gap-2 disabled:opacity-40"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with Brain...</>
                        ) : (
                            <><Brain className="w-4 h-4" /> Analyze with Brain</>
                        )}
                    </button>
                </div>
            )}

            {/* Reset */}
            {result && (
                <button
                    onClick={() => { setResult(null); setFile(null); setYoutubeUrl(''); }}
                    className="text-ash text-sm flex items-center gap-2 hover:text-chalk transition-colors"
                >
                    <X className="w-4 h-4" /> Analyze Another
                </button>
            )}

            {/* Results */}
            {result && <ResultView result={result} onGenerateFlashcards={() => { }} />}
        </div>
    );
}
