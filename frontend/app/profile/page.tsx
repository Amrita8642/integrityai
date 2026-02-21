'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initAuth, useAuthStore } from '@/lib/store';
import BottomNav from '@/components/layout/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const u = initAuth();
    if (!u) router.replace('/auth/login');
  }, []);

  function handleLogout() {
    logout();
    router.replace('/auth/login');
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-xl font-bold">Profile</h1>
      </div>

      <div className="px-4 flex flex-col gap-4 animate-slide-up">
        {/* Avatar + info */}
        <div className="card p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-20 h-20 rounded-full bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center">
            <span className="text-3xl font-bold text-brand-400">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-sm text-white/50">{user?.email}</p>
            <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
              user?.role === 'educator' ? 'bg-accent-500/20 text-accent-400' : 'bg-brand-500/20 text-brand-400'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Info cards */}
        <div className="card p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wide">About IntegrityAI</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            IntegrityAI is a <span className="text-brand-400 font-medium">learning-first</span> academic integrity coach.
            We help you understand your work better, improve your citations, and grow as a writer — not just flag issues.
          </p>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wide mb-3">Privacy</h2>
          <p className="text-sm text-white/50">Your submissions are never used to train AI models. Drafts are automatically deleted after 30 days.</p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 font-medium py-3 rounded-xl transition-colors"
        >
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
