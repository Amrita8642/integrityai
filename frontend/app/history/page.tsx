'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initAuth } from '@/lib/store';
import { getDraftHistory } from '@/lib/api';
import BottomNav from '@/components/layout/BottomNav';
import ScoreMeter from '@/components/ui/ScoreMeter';
import RiskBadge from '@/components/ui/RiskBadge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { Draft } from '@/types';

export default function HistoryPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = initAuth();
    if (!u) { router.replace('/auth/login'); return; }
    getDraftHistory().then(setDrafts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">Draft History</h1>
        <p className="text-sm text-white/40 mt-1">{drafts.length} submissions</p>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {loading ? (
          [1,2,3,4].map((i) => <SkeletonCard key={i} />)
        ) : drafts.length === 0 ? (
          <div className="card p-8 text-center mt-4">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-white/50 text-sm">No drafts yet.</p>
            <Link href="/draft" className="mt-4 inline-block text-brand-400 text-sm font-medium">
              Start your first draft →
            </Link>
          </div>
        ) : (
          drafts.map((draft, idx) => (
            <Link key={draft.id} href={`/history/${draft.id}`} className="card p-4 hover:border-white/15 transition-colors animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Draft #{draft.id}</span>
                    {draft.risk_level && <RiskBadge level={draft.risk_level as any} />}
                  </div>
                  <p className="text-xs text-white/30 mt-0.5">{new Date(draft.created_at).toLocaleString()}</p>
                  <p className="text-xs text-white/50 mt-2 line-clamp-2">{draft.content.slice(0, 120)}</p>

                  {draft.similarity_score !== null && (
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-xs text-white/30">Similarity</p>
                        <p className="text-sm font-semibold text-yellow-400">{Math.round(draft.similarity_score)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/30">AI Prob.</p>
                        <p className="text-sm font-semibold text-accent-400">{Math.round(draft.ai_probability ?? 0)}%</p>
                      </div>
                    </div>
                  )}
                </div>
                {draft.learning_score !== null && (
                  <ScoreMeter score={draft.learning_score} size={60} label="" />
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
