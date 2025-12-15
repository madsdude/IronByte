import { create } from 'zustand';
import { Team, TeamMember } from '../types';
import { api } from '../lib/api';

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
      const data = await api.get('/teams');
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
      const data = await api.get('/team-members');
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
      const newTeam = await api.post('/teams', team);
      set(state => ({ teams: [...state.teams, newTeam] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add team' });
    } finally {
      set({ loading: false });
    }
  },

  updateTeam: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedTeam = await api.patch(`/teams/${id}`, updates);
      set(state => ({
        teams: state.teams.map(team => team.id === id ? updatedTeam : team)
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
      await api.delete(`/teams/${id}`);
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
      const newMember = await api.post('/team-members', {
          team_id: teamMember.teamId,
          user_id: teamMember.userId,
          role: teamMember.role
      });
      set(state => ({ teamMembers: [...state.teamMembers, newMember] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add team member' });
    } finally {
      set({ loading: false });
    }
  },

  removeTeamMember: async (teamId, userId) => {
    set({ loading: true, error: null });
    try {
      // DELETE with body or query params
      // Our simple API client might not support body in delete method correctly if using fetch defaults depending on impl,
      // but standard fetch allows it. Let's assume server supports it or params.
      // I updated server to support query params too if body empty.
      // But standard fetch body in DELETE is discouraged.
      // Let's rely on my updated server.js which checks query params if body properties are missing?
      // Actually my server.js checks `req.body.team_id || req.query.team_id`.
      // So I'll try to pass via query params to be safe.
      await api.delete(`/team-members?team_id=${teamId}&user_id=${userId}`);

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
      const updatedMember = await api.patch('/team-members', {
          team_id: teamId,
          user_id: userId,
          role
      });
      set(state => ({
        teamMembers: state.teamMembers.map(member =>
          member.teamId === teamId && member.userId === userId ? updatedMember : member
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update team member role' });
    } finally {
      set({ loading: false });
    }
  },
}));
