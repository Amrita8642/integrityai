import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'educator';
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    Cookies.set('token', token, { expires: 7 });
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token });
  },
  logout: () => {
    Cookies.remove('token');
    if (typeof window !== 'undefined') localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));

export function initAuth(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('user');
  const token = Cookies.get('token');
  if (stored && token) {
    const user = JSON.parse(stored);
    useAuthStore.setState({ user, token });
    return user;
  }
  return null;
}
