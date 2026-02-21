'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(form);
      setAuth(data.user, data.access_token);
      router.push(data.user.role === 'educator' ? '/educator' : '/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center glow-green">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-5z" fill="white"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">IntegrityAI</h1>
          <p className="text-sm text-white/50 mt-1">Learn. Improve. Submit with confidence.</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card p-6 animate-slide-up">
        <h2 className="text-lg font-semibold mb-6">Welcome back</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wide">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@university.edu"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/25 focus:border-brand-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wide">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/25 focus:border-brand-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/40">
          No account?{' '}
          <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 transition-colors">
            Sign up
          </Link>
        </p>

        {/* Demo accounts */}
        <div className="mt-6 p-3 bg-white/3 rounded-xl border border-white/5">
          <p className="text-xs text-white/30 font-medium mb-2 uppercase tracking-wide">Demo accounts</p>
          <p className="text-xs text-white/50">Student: student@demo.com / demo1234</p>
          <p className="text-xs text-white/50">Educator: educator@demo.com / demo1234</p>
        </div>
      </div>
    </div>
  );
}
