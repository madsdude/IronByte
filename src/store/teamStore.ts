import { create } from 'zustand';
import { Team, TeamMember } from '../types';
import { supabase } from '../lib/supabase';

interface TeamState {
  teams: Team[];
  teamMembers: TeamMember[];
  loading: boolean;
  error: string | null;
  fetchTeams: () => Promise<void>;
  fetchTeamMembers: () => Promise<void>;
  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => Promise<void>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addTeamMember: (teamMember: Omit<TeamMember, 'createdAt'>) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  updateTeamMemberRole: (teamId: string, userId: string, role: TeamMember['role']) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  teamMembers: [],
  loading: false,
  error: null,

  fetchTeams: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ teams: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch teams' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTeamMembers: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at');

      if (error) throw error;
      set({ teamMembers: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch team members' });
    } finally {
      set({ loading: false });
    }
  },

  addTeam: async (team) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([team])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ teams: [...state.teams, data] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add team' });
    } finally {
      set({ loading: false });
    }
  },

  updateTeam: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        teams: state.teams.map(team => team.id === id ? data : team)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update team' });
    } finally {
      set({ loading: false });
    }
  },

  deleteTeam: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        teams: state.teams.filter(team => team.id !== id)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete team' });
    } finally {
      set({ loading: false });
    }
  },

  addTeamMember: async (teamMember) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert([teamMember])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ teamMembers: [...state.teamMembers, data] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add team member' });
    } finally {
      set({ loading: false });
    }
  },

  removeTeamMember: async (teamId, userId) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
      set(state => ({
        teamMembers: state.teamMembers.filter(
          member => !(member.teamId === teamId && member.userId === userId)
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove team member' });
    } finally {
      set({ loading: false });
    }
  },

  updateTeamMemberRole: async (teamId, userId, role) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        teamMembers: state.teamMembers.map(member =>
          member.teamId === teamId && member.userId === userId ? data : member
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update team member role' });
    } finally {
      set({ loading: false });
    }
  },
}));