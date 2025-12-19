import { create } from 'zustand';
import { api } from '../lib/api';

interface UserInfo {
  id: string;
  email: string;
  display_name?: string;
  displayName?: string; // alias
  role?: string;
}

interface UserState {
  users: Record<string, UserInfo | null>;
  loading: boolean;
  error: string | null;
  fetchUser: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: {},
  loading: false,
  error: null,

  fetchUser: async (userId: string) => {
    // Check if we already have this user's info and it's not null
    if (get().users[userId] !== undefined) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const users = await api.get('/users');
      const user = users.find((u: any) => u.id === userId);

      if (user) {
        set(state => ({
          users: {
            ...state.users,
            [userId]: {
              id: user.id,
              email: user.email,
              displayName: user.display_name || user.email.split('@')[0],
              display_name: user.display_name,
              role: user.role
            }
          }
        }));
      } else {
        set(state => ({
          users: {
            ...state.users,
            [userId]: null
          }
        }));
      }

    } catch (error: any) {
      console.error('Error in fetchUser:', error);
      set(state => ({
        error: error.message,
        users: {
          ...state.users,
          [userId]: null
        }
      }));
    } finally {
      set({ loading: false });
    }
  }
}));
