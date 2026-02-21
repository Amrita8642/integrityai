'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { initAuth } from '@/lib/store';
import { createAssignment, createDraft, runIntegrityCheck, uploadFile } from '@/lib/api';
import BottomNav from '@/components/layout/BottomNav';
import ScoreMeter from '@/components/ui/ScoreMeter';
import RiskBadge from '@/components/ui/RiskBadge';
import type { Draft } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStep = 'edit' | 'reading' | 'checking' | 'result';

interface ExtractionMeta {
  filename: string;
  fileType: string;
  pageCount: number;
  scanned: boolean;
  warning: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse extracted text into segments for the structured editor.
 * Detects "Page N:" and "Slide N:" markers.
 */
function parseSegments(text: string): { label: string; body: string }[] {
  const regex = /^((?:Page|Slide)\s+\d+):?\s*/gm;
  const segments: { label: string; body: string }[] = [];
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0) {
    return [{ label: '', body: text }];
  }

  matches.forEach((match, idx) => {
    const start = match.index! + match[0].length;
    const end = matches[idx + 1]?.index ?? text.length;
    segments.push({
      label: match[1],
      body: text.slice(start, end).trim(),
    });
  });

  return segments;
}

function segmentsToText(segments: { label: string; body: string }[]): string {
  return segments
    .map((s) => (s.label ? `${s.label}:\n${s.body}` : s.body))
    .join('\n\n');
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ReadingAnimation({ filename }: { filename: string }) {
  const [dots, setDots] = useState('');
  const [phase, setPhase] = useState(0);

  const phases = [
    'Opening document…',
    'Reading your document…',
    'Extracting text content…',
    'Preserving page structure…',
    'Almost done…',
  ];

  useEffect(() => {
    const dotTimer = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 450);
    const phaseTimer = setInterval(
      () => setPhase((p) => Math.min(p + 1, phases.length - 1)),
      1200,
    );
    return () => {
      clearInterval(dotTimer);
      clearInterval(phaseTimer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8">
      {/* Animated document icon */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-[#1a1d27] border border-white/10 flex items-center justify-center shadow-2xl">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="animate-pulse">
            <path
              d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
              stroke="#22c55e"
              strokeWidth={1.5}
              fill="rgba(34,197,94,0.08)"
            />
            <polyline points="14 2 14 8 20 8" stroke="#22c55e" strokeWidth={1.5} />
            <line x1="8" y1="13" x2="16" y2="13" stroke="#22c55e" strokeWidth={1.5} strokeLinecap="round" />
            <line x1="8" y1="17" x2="12" y2="17" stroke="#22c55e" strokeWidth={1.5} strokeLinecap="round" />
          </svg>
        </div>

        {/* Orbit spinner */}
        <div
          className="absolute -inset-3 rounded-full border-2 border-dashed border-brand-500/25 animate-spin"
          style={{ animationDuration: '4s' }}
        />
        <div
          className="absolute -inset-6 rounded-full border border-brand-500/10 animate-spin"
          style={{ animationDuration: '7s', animationDirection: 'reverse' }}
        />

        {/* Scanning line */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-70"
            style={{
              animation: 'scanLine 1.8s ease-in-out infinite',
              top: '20%',
            }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-white">
          {phases[phase]}
          <span className="text-brand-400">{dots}</span>
        </p>
        <p className="text-sm text-white/40 mt-2 max-w-xs truncate">{filename}</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {phases.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ${
              i <= phase
                ? 'w-6 h-1.5 bg-brand-500'
                : 'w-1.5 h-1.5 bg-white/15'
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 10%; opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function CheckingAnimation({ statusMsg }: { statusMsg: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-brand-500/15 border-t-brand-500 animate-spin" />
        <div className="absolute inset-3 rounded-full border-4 border-accent-500/10 border-b-accent-500/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-5z" fill="#22c55e" opacity="0.9" />
          </svg>
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">Running Integrity Check</p>
        <p className="text-sm text-white/50 mt-2">{statusMsg}</p>
      </div>
    </div>
  );
}

/**
 * Structured text editor that shows Page N / Slide N markers
 * and lets the user edit each section independently.
 */
function StructuredEditor({
  segments,
  onChange,
}: {
  segments: { label: string; body: string }[];
  onChange: (updated: { label: string; body: string }[]) => void;
}) {
  function update(idx: number, body: string) {
    const next = segments.map((s, i) => (i === idx ? { ...s, body } : s));
    onChange(next);
  }

  // Single block (no markers)
  if (segments.length === 1 && !segments[0].label) {
    return (
      <textarea
        value={segments[0].body}
        onChange={(e) => update(0, e.target.value)}
        rows={14}
        placeholder="Your extracted text will appear here…"
        className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/20 resize-none leading-relaxed font-mono"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto pr-1">
      {segments.map((seg, idx) => (
        <div key={idx} className="flex flex-col gap-1.5">
          {seg.label && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                {seg.label}
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          )}
          <textarea
            value={seg.body}
            onChange={(e) => update(idx, e.target.value)}
            rows={Math.max(3, Math.ceil(seg.body.length / 60))}
            className={`w-full bg-white/3 border border-white/6 rounded-xl px-3 py-2.5 text-sm leading-relaxed resize-none font-mono text-white/80 focus:border-brand-500/30 transition-colors ${
              seg.body.startsWith('[No') || seg.body.startsWith('[⚠')
                ? 'text-yellow-400/70 italic'
                : ''
            }`}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Results view ─────────────────────────────────────────────────────────────

function ResultsView({
  result,
  onReset,
}: {
  result: Draft;
  onReset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={onReset}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold">Integrity Results</h1>
            <p className="text-xs text-white/40">
              Draft #{result.id} · {new Date(result.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4 animate-slide-up">
        {/* Score card */}
        <div className="card p-5">
          <div className="flex items-center justify-around mb-4">
            <ScoreMeter score={result.learning_score ?? 0} size={88} label="Learning Score" />
            <div className="flex flex-col gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-yellow-400">
                  {Math.round(result.similarity_score ?? 0)}%
                </p>
                <p className="text-xs text-white/40">Similarity</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-400">
                  {Math.round(result.ai_probability ?? 0)}%
                </p>
                <p className="text-xs text-white/40">AI Probability</p>
              </div>
            </div>
            <RiskBadge level={(result.risk_level ?? 'Low') as any} />
          </div>

          {/* Progress bars */}
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Similarity', value: result.similarity_score ?? 0, color: 'bg-yellow-400' },
              { label: 'AI Probability', value: result.ai_probability ?? 0, color: 'bg-accent-500' },
              { label: 'Learning Score', value: result.learning_score ?? 0, color: 'bg-brand-500' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>{label}</span>
                  <span>{Math.round(value)}%</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${color}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {result.feedback && (
          <div className="card p-4 border-brand-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span>💬</span>
              <span className="font-semibold text-sm">AI Feedback</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{result.feedback}</p>
          </div>
        )}

        {/* Improvement tips */}
        {result.improvement_tips && (
          <div className="card p-4 border-accent-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span>💡</span>
              <span className="font-semibold text-sm">How to Improve</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
              {result.improvement_tips}
            </p>
          </div>
        )}

        {/* Citations */}
        {result.missing_citations &&
          result.missing_citations !== 'No missing citations detected' && (
            <div className="card p-4 border-yellow-400/20">
              <div className="flex items-center gap-2 mb-2">
                <span>📚</span>
                <span className="font-semibold text-sm">Citation Suggestions</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{result.missing_citations}</p>
            </div>
          )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition-colors text-sm"
          >
            New Draft
          </button>
          <button
            onClick={() => router.push('/history')}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 rounded-xl transition-colors text-sm"
          >
            View History
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DraftPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Content state
  const [segments, setSegments] = useState<{ label: string; body: string }[]>([
    { label: '', body: '' },
  ]);
  const [reflection, setReflection] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Flow state
  const [step, setStep] = useState<AppStep>('edit');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Draft | null>(null);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [readingFilename, setReadingFilename] = useState('');
  const [extractionMeta, setExtractionMeta] = useState<ExtractionMeta | null>(null);

  // Computed
  const content = segmentsToText(segments).trim();
  const hasContent = content.length > 0;

  useEffect(() => {
    const u = initAuth();
    if (!u) router.replace('/auth/login');
  }, []);

  // ── Assignment / draft helpers ──────────────────────────────────
  async function ensureAssignment(): Promise<number> {
    const assignment = await createAssignment();
    return assignment.id;
  }

  // ── File upload flow ────────────────────────────────────────────
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (fileRef.current) fileRef.current.value = '';

      setError('');

      // Client-side size check
      if (file.size > 10 * 1024 * 1024) {
        setError('File is too large. Maximum allowed size is 10 MB.');
        return;
      }

      // Show reading animation
      setReadingFilename(file.name);
      setStep('reading');
      setUploadProgress(0);

      try {
        // Create assignment + placeholder draft
        const assignmentId = await ensureAssignment();
        const draft = await createDraft({
          assignment_id: assignmentId,
          content: '(document upload in progress)',
        });

        // Upload + extract
        const fileData = await uploadFile(draft.id, file, (pct) =>
          setUploadProgress(pct),
        ) as any;

        const extracted: string = fileData.extracted_text || '';

        if (!extracted.trim()) {
          setError(
            'No text could be extracted from this file. ' +
              'It may be empty or contain only images.',
          );
          setStep('edit');
          return;
        }

        // Parse into structured segments
        const parsed = parseSegments(extracted);
        setSegments(parsed);

        setExtractionMeta({
          filename: file.name,
          fileType: fileData.file_type,
          pageCount: fileData.page_count ?? 0,
          scanned: fileData.scanned ?? false,
          warning: fileData.warning ?? '',
        });

        setStep('edit');
        setUploadProgress(null);
      } catch (err: any) {
        setError(err.message || 'Failed to process the document. Please try again.');
        setStep('edit');
        setUploadProgress(null);
      }
    },
    [],
  );

  // ── Integrity check flow ────────────────────────────────────────
  async function handleCheck() {
    if (!hasContent) {
      setError('Please add some text before running the integrity check.');
      return;
    }
    setError('');
    setStep('checking');

    try {
      setStatusMsg('Preparing your workspace…');
      const assignmentId = await ensureAssignment();

      setStatusMsg('Saving your draft…');
      const draft = await createDraft({
        assignment_id: assignmentId,
        content,
        reflection_text: reflection || undefined,
        language,
      });

      setStatusMsg('Analysing with AI…');
      const checked = await runIntegrityCheck(draft.id, language);
      setResult(checked);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('edit');
    }
  }

  function reset() {
    setSegments([{ label: '', body: '' }]);
    setReflection('');
    setResult(null);
    setExtractionMeta(null);
    setError('');
    setStep('edit');
    setUploadProgress(null);
  }

  // ── Render steps ────────────────────────────────────────────────

  if (step === 'reading') {
    return <ReadingAnimation filename={readingFilename} />;
  }

  if (step === 'checking') {
    return <CheckingAnimation statusMsg={statusMsg} />;
  }

  if (step === 'result' && result) {
    return <ResultsView result={result} onReset={reset} />;
  }

  // ── Edit step ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">New Draft</h1>
        <p className="text-sm text-white/40 mt-1">Write or upload your submission</p>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Error banner */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Upload zone ─────────────────────────────────────── */}
        <div className="card p-4">
          <p className="text-xs text-white/50 uppercase tracking-wide font-medium mb-3">
            Upload Document
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.ppt,.pptx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-white/12 hover:border-brand-500/50 rounded-2xl py-6 flex flex-col items-center gap-2.5 transition-all hover:bg-brand-500/3"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={1.5}
                />
                <polyline points="14 2 14 8 20 8" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
                <line x1="12" y1="12" x2="12" y2="17" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" />
                <line x1="9.5" y1="14.5" x2="12" y2="12" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" />
                <line x1="14.5" y1="14.5" x2="12" y2="12" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/70">Tap to upload document</p>
              <p className="text-xs text-white/35 mt-0.5">PDF · PPT · PPTX · TXT — Max 10 MB</p>
            </div>
          </button>

          {/* Upload progress */}
          {uploadProgress !== null && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-brand-500"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Extraction metadata banner ───────────────────────── */}
        {extractionMeta && (
          <div
            className={`rounded-2xl border px-4 py-3 flex flex-col gap-1.5 ${
              extractionMeta.scanned
                ? 'bg-yellow-400/8 border-yellow-400/25'
                : 'bg-brand-500/8 border-brand-500/25'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{extractionMeta.scanned ? '⚠️' : '✅'}</span>
              <p className="text-sm font-medium text-white/80 truncate">
                {extractionMeta.filename}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/45">
              <span className="uppercase font-medium">{extractionMeta.fileType}</span>
              <span>·</span>
              <span>
                {extractionMeta.pageCount}{' '}
                {extractionMeta.fileType === 'pdf' ? 'pages' : 'slides'} detected
              </span>
            </div>
            {extractionMeta.scanned && (
              <p className="text-xs text-yellow-400/80 mt-0.5">
                This appears to be a scanned document. OCR is not enabled. You can type or paste
                your text manually below.
              </p>
            )}
            {extractionMeta.warning && !extractionMeta.scanned && (
              <p className="text-xs text-yellow-400/70 mt-0.5">{extractionMeta.warning}</p>
            )}
            {!extractionMeta.scanned && (
              <p className="text-xs text-brand-400/80">
                Text extracted successfully. Review and edit below before checking.
              </p>
            )}
          </div>
        )}

        {/* ── Text editor ─────────────────────────────────────── */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-xs text-white/50 uppercase tracking-wide font-medium">
                {extractionMeta ? 'Extracted Text' : 'Your Submission'}
              </p>
              {extractionMeta && (
                <span className="text-[10px] bg-brand-500/15 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/20 font-medium">
                  Editable
                </span>
              )}
            </div>
            <span className="text-xs text-white/25">{content.length} chars</span>
          </div>

          <StructuredEditor segments={segments} onChange={setSegments} />

          {!extractionMeta && segments[0].body === '' && (
            <p className="text-xs text-white/25 mt-2">
              Or upload a file above to auto-fill this editor.
            </p>
          )}
        </div>

        {/* ── Reflection ──────────────────────────────────────── */}
        <div className="card p-4">
          <p className="text-xs text-white/50 uppercase tracking-wide font-medium mb-3">
            Reflection{' '}
            <span className="normal-case text-white/25 font-normal">(optional)</span>
          </p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What's your main argument? Which sources did you use? What are you unsure about?"
            rows={3}
            className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/20 resize-none leading-relaxed"
          />
        </div>

        {/* ── Language ────────────────────────────────────────── */}
        <div className="card p-4">
          <p className="text-xs text-white/50 uppercase tracking-wide font-medium mb-3">
            Feedback Language
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'en', label: '🇬🇧 English' },
              { value: 'hi', label: '🇮🇳 Hindi' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLanguage(value as 'en' | 'hi')}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  language === value
                    ? 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <button
          onClick={handleCheck}
          disabled={!hasContent}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-35 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2.5 text-base glow-green"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
            <path d="M12 2L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-5z" />
          </svg>
          Run Integrity Check
        </button>

        {!hasContent && (
          <p className="text-center text-xs text-white/25 -mt-2">
            Write or upload content to enable the check
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
