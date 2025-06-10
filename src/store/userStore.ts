import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface UserInfo {
  id: string;
  email: string;
  displayName?: string;
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
      // Get the current authenticated user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authenticated session');
      }

      // First try to get the user from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, display_name')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (userData) {
        // User found in users table, update the store
        set(state => ({
          users: {
            ...state.users,
            [userId]: {
              id: userData.id,
              email: userData.email,
              displayName: userData.display_name || userData.email.split('@')[0]
            }
          }
        }));
        return;
      }

      // If we're here, the user wasn't found in the users table
      // Get the user's email from their session if it matches the requested userId
      if (session.user.id === userId) {
        const userEmail = session.user.email;
        if (!userEmail) {
          throw new Error('User email not found');
        }

        // Create a new entry in the users table
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: userId,
              email: userEmail,
              display_name: userEmail.split('@')[0]
            }
          ])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Set the user info in the store
        set(state => ({
          users: {
            ...state.users,
            [userId]: {
              id: newUser.id,
              email: newUser.email,
              displayName: newUser.display_name
            }
          }
        }));
      } else {
        // If we can't create the user (because it's not the current user),
        // store null to prevent repeated fetching attempts
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