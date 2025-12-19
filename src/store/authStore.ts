import { create } from 'zustand';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  login: (email: string, password?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  clearUser: () => {
    localStorage.removeItem('auth-token');
    set({ user: null, loading: false });
  },
  login: async (email: string, password?: string) => {
    try {
      const { user, token } = await api.post('/auth/login', { email, password });
      localStorage.setItem('auth-token', token);
      set({ user, loading: false });
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  },
}));

// Check auth on load
api.get('/auth/me').then(({ user }) => {
  useAuthStore.getState().setUser(user);
}).catch(() => {
  useAuthStore.getState().setUser(null);
});
