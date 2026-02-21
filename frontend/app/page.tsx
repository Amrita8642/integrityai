'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initAuth } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = initAuth();
    if (user) {
      router.replace(user.role === 'educator' ? '/educator' : '/dashboard');
    } else {
      router.replace('/auth/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-5z" fill="white"/>
          </svg>
        </div>
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
