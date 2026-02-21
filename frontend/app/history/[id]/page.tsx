'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initAuth } from '@/lib/store';
import { getDraft } from '@/lib/api';
import BottomNav from '@/components/layout/BottomNav';
import ScoreMeter from '@/components/ui/ScoreMeter';
import RiskBadge from '@/components/ui/RiskBadge';
import { SkeletonText } from '@/components/ui/Skeleton';
import type { Draft } from '@/types';

export default function DraftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = initAuth();
    if (!u) { router.replace('/auth/login'); return; }
    getDraft(Number(id)).then(setDraft).catch(() => router.replace('/history')).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-12">
        <div className="skeleton h-6 w-40 rounded-xl mb-2" />
        <div className="skeleton h-4 w-32 rounded-xl mb-6" />
        <div className="card p-4"><SkeletonText lines={5} /></div>
        <BottomNav />
      </div>
    );
  }

  if (!draft) return null;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold">Draft #{draft.id}</h1>
          <p className="text-xs text-white/40">{new Date(draft.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4 animate-slide-up">
        {draft.learning_score !== null && (
          <div className="card p-5">
            <div className="flex items-center justify-around">
              <ScoreMeter score={draft.learning_score} size={88} label="Learning Score" />
              <div className="flex flex-col gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{Math.round(draft.similarity_score ?? 0)}%</p>
                  <p className="text-xs text-white/40">Similarity</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent-400">{Math.round(draft.ai_probability ?? 0)}%</p>
                  <p className="text-xs text-white/40">AI Probability</p>
                </div>
              </div>
              {draft.risk_level && <RiskBadge level={draft.risk_level as any} />}
            </div>
          </div>
        )}

        <div className="card p-4">
          <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">Submission Content</p>
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap line-clamp-6">{draft.content}</p>
        </div>

        {draft.feedback && (
          <div className="card p-4 border-brand-500/20">
            <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">💬 AI Feedback</p>
            <p className="text-sm text-white/70 leading-relaxed">{draft.feedback}</p>
          </div>
        )}

        {draft.improvement_tips && (
          <div className="card p-4 border-accent-500/20">
            <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">💡 Improvement Tips</p>
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{draft.improvement_tips}</p>
          </div>
        )}

        {draft.missing_citations && draft.missing_citations !== 'No missing citations detected' && (
          <div className="card p-4 border-yellow-400/20">
            <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">📚 Citation Suggestions</p>
            <p className="text-sm text-white/70 leading-relaxed">{draft.missing_citations}</p>
          </div>
        )}

        {draft.reflection_text && (
          <div className="card p-4">
            <p className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2">🪞 Your Reflection</p>
            <p className="text-sm text-white/70 leading-relaxed">{draft.reflection_text}</p>
          </div>
        )}

        {!draft.learning_score && (
          <div className="card p-6 text-center border-dashed">
            <p className="text-white/40 text-sm">No integrity check run yet on this draft.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
