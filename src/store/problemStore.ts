import { create } from 'zustand';
import { api } from '../lib/api';

export interface Problem {
    id: string;
    title: string;
    description: string;
    root_cause?: string;
    resolution?: string;
    status: 'open' | 'identified' | 'resolved' | 'closed';
    created_at: string;
    updated_at: string;
    ticket_count?: number;
    tickets?: any[]; // Linked tickets
}

interface ProblemState {
    problems: Problem[];
    currentProblem: Problem | null;
    loading: boolean;
    error: string | null;
    fetchProblems: () => Promise<void>;
    fetchProblem: (id: string) => Promise<void>;
    createProblem: (data: Partial<Problem>) => Promise<void>;
    updateProblem: (id: string, data: Partial<Problem>) => Promise<void>;
    linkTicket: (problemId: string, ticketId: string) => Promise<void>;
    unlinkTicket: (problemId: string, ticketId: string) => Promise<void>;
    resolveProblem: (id: string, resolution: string) => Promise<void>;
    deleteProblem: (id: string) => Promise<void>;
}

export const useProblemStore = create<ProblemState>((set) => ({
    problems: [],
    currentProblem: null,
    loading: false,
    error: null,

    fetchProblems: async () => {
        set({ loading: true, error: null });
        try {
            const data = await api.get('/problems');
            set({ problems: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchProblem: async (id) => {
        set({ loading: true, error: null });
        try {
            const data = await api.get(`/problems/${id}`);
            set({ currentProblem: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createProblem: async (data) => {
        set({ loading: true, error: null });
        try {
            const newProblem = await api.post('/problems', data);
            set((state) => ({
                problems: [newProblem, ...state.problems],
                loading: false
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    updateProblem: async (id, data) => {
        set({ loading: true, error: null });
        try {
            const updated = await api.put(`/problems/${id}`, data);
            set((state) => ({
                problems: state.problems.map((p) => p.id === id ? updated : p),
                currentProblem: state.currentProblem?.id === id ? { ...state.currentProblem, ...updated } : state.currentProblem,
                loading: false
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    linkTicket: async (problemId, ticketId) => {
        try {
            await api.post(`/problems/${problemId}/tickets`, { ticketId });
            // Refresh current problem to get updated tickets
            const updated = await api.get(`/problems/${problemId}`);
            set({ currentProblem: updated });
        } catch (error: any) {
            console.error(error);
        }
    },

    unlinkTicket: async (problemId, ticketId) => {
        try {
            await api.delete(`/problems/${problemId}/tickets/${ticketId}`);
            // Refresh current problem
            const updated = await api.get(`/problems/${problemId}`);
            set({ currentProblem: updated });
        } catch (error: any) {
            console.error(error);
        }
    },

    resolveProblem: async (id, resolution) => {
        set({ loading: true });
        try {
            const updated = await api.post(`/problems/${id}/resolve`, { resolution });
            set((state) => ({
                problems: state.problems.map((p) => p.id === id ? updated : p),
                currentProblem: state.currentProblem?.id === id ? updated : state.currentProblem,
                loading: false
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    deleteProblem: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/problems/${id}`);
            set((state) => ({
                problems: state.problems.filter((p) => p.id !== id),
                currentProblem: state.currentProblem?.id === id ? null : state.currentProblem,
                loading: false
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    }
}));
