'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initAuth, useAuthStore } from '@/lib/store';
import { getSubmissions, getStudents, getPolicy, setPolicy } from '@/lib/api';
import { SkeletonCard } from '@/components/ui/Skeleton';
import RiskBadge from '@/components/ui/RiskBadge';
import ScoreMeter from '@/components/ui/ScoreMeter';

type Tab = 'students' | 'submissions' | 'policy';

export default function EducatorPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [policy, setPolicyState] = useState({ similarity_threshold: 30, min_drafts: 2 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const u = initAuth();
    if (!u) { router.replace('/auth/login'); return; }
    if (u.role !== 'educator') { router.replace('/dashboard'); return; }
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, sub, pol] = await Promise.all([getStudents(), getSubmissions(), getPolicy()]);
      setStudents(s);
      setSubmissions(sub);
      setPolicyState({ similarity_threshold: pol.similarity_threshold, min_drafts: pol.min_drafts });
    } catch {}
    setLoading(false);
  }

  async function savePolicy() {
    setSaving(true);
    try {
      await setPolicy(policy);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'students', label: 'Students', emoji: '🎓' },
    { key: 'submissions', label: 'Submissions', emoji: '📄' },
    { key: 'policy', label: 'Policy', emoji: '⚙️' },
  ];

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-[#1a1d27] to-transparent flex items-center justify-between">
        <div>
          <p className="text-sm text-white/40">Educator Dashboard</p>
          <h1 className="text-xl font-bold">{user?.name}</h1>
        </div>
        <button
          onClick={() => { logout(); router.replace('/auth/login'); }}
          className="text-xs text-white/30 hover:text-white/60 transition-colors px-3 py-1.5 rounded-lg bg-white/5"
        >
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-4">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-brand-400">{students.length}</p>
          <p className="text-xs text-white/40 mt-0.5">Students</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-accent-400">{submissions.length}</p>
          <p className="text-xs text-white/40 mt-0.5">Drafts</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {submissions.filter((s) => s.risk_level === 'High').length}
          </p>
          <p className="text-xs text-white/40 mt-0.5">High Risk</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-white/5 rounded-xl p-1 gap-1">
          {tabs.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === key ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex flex-col gap-3">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
        ) : tab === 'students' ? (
          <div className="flex flex-col gap-3">
            {students.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-white/40 text-sm">No students enrolled yet.</p>
              </div>
            ) : students.map((s: any) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-400 font-bold text-sm">{s.name[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-white/40 truncate">{s.email}</p>
                    <p className="text-xs text-white/30 mt-1">{s.total_drafts} drafts checked</p>
                  </div>
                  {s.avg_learning_score !== null && (
                    <ScoreMeter score={Math.round(s.avg_learning_score)} size={52} label="" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'submissions' ? (
          <div className="flex flex-col gap-3">
            {submissions.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-white/40 text-sm">No submissions yet.</p>
              </div>
            ) : submissions.map((s: any, i: number) => (
              <div key={i} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{s.student_name}</p>
                    <p className="text-xs text-white/40 truncate">{s.assignment_title}</p>
                    <p className="text-xs text-white/30 mt-0.5">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  {s.learning_score !== null && (
                    <ScoreMeter score={s.learning_score} size={52} label="" />
                  )}
                </div>
                {s.risk_level && (
                  <div className="mt-3 flex items-center gap-3">
                    <RiskBadge level={s.risk_level} />
                    {s.similarity_score !== null && (
                      <span className="text-xs text-white/40">{Math.round(s.similarity_score)}% similarity</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-5 flex flex-col gap-5">
            <h2 className="font-semibold">Integrity Policy Settings</h2>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Similarity Threshold</span>
                <span className="font-bold text-yellow-400">{policy.similarity_threshold}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={policy.similarity_threshold}
                onChange={(e) => setPolicyState({ ...policy, similarity_threshold: Number(e.target.value) })}
                className="w-full accent-brand-500"
              />
              <p className="text-xs text-white/30 mt-1">Drafts above this threshold are flagged as high risk.</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Minimum Drafts Required</span>
                <span className="font-bold text-brand-400">{policy.min_drafts}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={policy.min_drafts}
                onChange={(e) => setPolicyState({ ...policy, min_drafts: Number(e.target.value) })}
                className="w-full accent-brand-500"
              />
              <p className="text-xs text-white/30 mt-1">Students must submit this many drafts before final submission.</p>
            </div>

            <button
              onClick={savePolicy}
              disabled={saving}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Policy'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
