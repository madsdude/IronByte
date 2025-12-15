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
      // Assuming a generic GET /teams endpoint
      // The backend doesn't implement this yet, but for structure correctness:
      const data = await api.get('/teams').catch(() => []); // Mocking empty array if fails

      set({ teams: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch teams' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTeamMembers: async () => {
     // Not implemented in backend yet
     set({ loading: false, teamMembers: [] });
  },

  addTeam: async (team) => {
     // Not implemented
  },

  updateTeam: async (id, updates) => {
     // Not implemented
  },

  deleteTeam: async (id) => {
     // Not implemented
  },

  addTeamMember: async (teamMember) => {
     // Not implemented
  },

  removeTeamMember: async (teamId, userId) => {
     // Not implemented
  },

  updateTeamMemberRole: async (teamId, userId, role) => {
     // Not implemented
  },
}));
