'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initAuth, useAuthStore } from '@/lib/store';
import { getDraftHistory, listAssignments } from '@/lib/api';
import BottomNav from '@/components/layout/BottomNav';
import ScoreMeter from '@/components/ui/ScoreMeter';
import RiskBadge from '@/components/ui/RiskBadge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { Draft } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = initAuth();
    if (!u) { router.replace('/auth/login'); return; }
    if (u.role === 'educator') { router.replace('/educator'); return; }
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getDraftHistory();
      setDrafts(data);
    } catch {}
    finally { setLoading(false); }
  }

  const checkedDrafts = drafts.filter((d) => d.learning_score !== null);
  const avgScore = checkedDrafts.length
    ? Math.round(checkedDrafts.reduce((a, d) => a + (d.learning_score ?? 0), 0) / checkedDrafts.length)
    : null;
  const recentDrafts = drafts.slice(0, 5);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-[#1a1d27] to-transparent">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm text-white/40">Welcome back,</p>
            <h1 className="text-xl font-bold">{user?.name ?? '—'} 👋</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span className="text-brand-400 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-brand-400">{drafts.length}</p>
            <p className="text-xs text-white/40 mt-0.5">Total Drafts</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-accent-400">{checkedDrafts.length}</p>
            <p className="text-xs text-white/40 mt-0.5">Checked</p>
          </div>
          <div className="card p-3 text-center">
            {avgScore !== null ? (
              <p className="text-2xl font-bold" style={{ color: avgScore >= 70 ? '#22c55e' : avgScore >= 40 ? '#facc15' : '#f87171' }}>
                {avgScore}
              </p>
            ) : (
              <p className="text-2xl font-bold text-white/20">—</p>
            )}
            <p className="text-xs text-white/40 mt-0.5">Avg Score</p>
          </div>
        </div>

        {/* Progress card */}
        {avgScore !== null && (
          <div className="card p-4 flex items-center gap-4 animate-slide-up">
            <ScoreMeter score={avgScore} size={80} label="Learning Score" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Your Learning Progress</p>
              <p className="text-xs text-white/50 mt-1">
                {avgScore >= 70
                  ? '🎉 Excellent! Your work shows strong understanding.'
                  : avgScore >= 40
                  ? '📈 Good progress. Keep improving your citations.'
                  : '💡 You\'re learning! Check the feedback on your drafts.'}
              </p>
            </div>
          </div>
        )}

        {/* Quick action */}
        <Link
          href="/draft"
          className="card p-4 flex items-center gap-3 border-brand-500/30 bg-brand-500/5 hover:bg-brand-500/10 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-brand-400">Start New Draft</p>
            <p className="text-xs text-white/40">Write or upload your submission</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>

        {/* Recent drafts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wide">Recent Drafts</h2>
            <Link href="/history" className="text-xs text-brand-400">See all</Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : recentDrafts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-white/50 text-sm">No drafts yet. Start your first one!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentDrafts.map((draft) => (
                <Link key={draft.id} href={`/history/${draft.id}`} className="card p-4 hover:border-white/15 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white/80">
                        Draft #{draft.id}
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {new Date(draft.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-white/50 mt-2 line-clamp-2">{draft.content.slice(0, 100)}…</p>
                    </div>
                    {draft.learning_score !== null && (
                      <ScoreMeter score={draft.learning_score} size={56} label="" />
                    )}
                  </div>
                  {draft.risk_level && (
                    <div className="mt-3 flex items-center gap-2">
                      <RiskBadge level={draft.risk_level as any} />
                      {draft.similarity_score !== null && (
                        <span className="text-xs text-white/30">{Math.round(draft.similarity_score)}% similar</span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
