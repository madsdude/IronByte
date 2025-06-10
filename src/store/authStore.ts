import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  clearUser: async () => {
    try {
      // Sign out from Supabase first
      await supabase.auth.signOut();
      
      // Get the current hostname to handle different project IDs
      const hostname = window.location.hostname;
      const projectRef = hostname.includes('localhost') 
        ? 'mggpiefolvwbmbbbznql' 
        : hostname.split('.')[0];
      
      // Clear all Supabase-related items from localStorage
      const itemsToRemove = [
        `sb-${projectRef}-auth-token`,
        `sb-${projectRef}-auth-session`,
        'supabase.auth.token',
        'supabase.auth.refreshToken',
      ];
      
      itemsToRemove.forEach(item => localStorage.removeItem(item));
      
      // Update the store state
      set({ user: null, loading: false });
    } catch (error) {
      console.error('Error clearing auth state:', error);
      // Still clear the store state even if there's an error
      set({ user: null, loading: false });
    }
  },
}));

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setUser(session?.user ?? null);
});

// Listen for auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setUser(session?.user ?? null);
});