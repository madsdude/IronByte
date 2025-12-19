import { create } from 'zustand';
import { api } from '../lib/api';
import { Change } from '../types';

interface ChangeStore {
    changes: Change[];
    change: Change | null;
    loading: boolean;
    error: string | null;

    fetchChanges: () => Promise<void>;
    fetchChange: (id: string) => Promise<void>;
    createChange: (data: Partial<Change>) => Promise<Change>;
    updateChange: (id: string, data: Partial<Change>) => Promise<void>;
    linkCI: (changeId: string, ciId: string) => Promise<void>;
    unlinkCI: (changeId: string, ciId: string) => Promise<void>;
    linkProblem: (changeId: string, problemId: string) => Promise<void>;
    approveChange: (id: string, userId?: string) => Promise<void>;
}

export const useChangeStore = create<ChangeStore>((set, get) => ({
    changes: [],
    change: null,
    loading: false,
    error: null,

    fetchChanges: async () => {
        set({ loading: true });
        try {
            const data = await api.get('/changes');
            set({ changes: data, loading: false, error: null });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchChange: async (id: string) => {
        set({ loading: true });
        try {
            const data = await api.get(`/changes/${id}`);
            set({ change: data, loading: false, error: null });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createChange: async (data) => {
        set({ loading: true });
        try {
            const newChange = await api.post('/changes', data);
            set(state => ({
                changes: [newChange, ...state.changes],
                loading: false,
                error: null
            }));
            return newChange;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateChange: async (id, data) => {
        try {
            const updated = await api.put(`/changes/${id}`, data);
            set(state => ({
                changes: state.changes.map(c => c.id === id ? { ...c, ...updated } : c),
                change: state.change?.id === id ? { ...state.change, ...updated } : state.change
            }));
        } catch (error: any) {
            console.error('Failed to update change', error);
            throw error;
        }
    },

    linkCI: async (changeId, ciId) => {
        await api.post(`/changes/${changeId}/cis`, { ciId });
        get().fetchChange(changeId); // Refresh to show linked CIs
    },

    unlinkCI: async (changeId, ciId) => {
        await api.delete(`/changes/${changeId}/cis/${ciId}`);
        get().fetchChange(changeId); // Refresh
    },

    linkProblem: async (changeId, problemId) => {
        await api.post(`/changes/${changeId}/problems`, { problemId });
        get().fetchChange(changeId);
    },

    approveChange: async (id, userId) => {
        await get().updateChange(id, { status: 'approved', approved_by: userId });
    }
}));
