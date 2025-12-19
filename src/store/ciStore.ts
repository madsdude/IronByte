import { create } from 'zustand';
import { api } from '../lib/api';

export interface ConfigurationItem {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive' | 'maintenance' | 'retired';
    description?: string;
    location?: string;
    owner_id?: string;
    created_at: string;
    updated_at: string;
}

interface CIState {
    cis: ConfigurationItem[];
    loading: boolean;
    error: string | null;
    fetchCIs: () => Promise<void>;
    addCI: (ci: Partial<ConfigurationItem>) => Promise<void>;
    deleteCI: (id: string) => Promise<void>;
}

export const useCIStore = create<CIState>((set, get) => ({
    cis: [],
    loading: false,
    error: null,

    fetchCIs: async () => {
        set({ loading: true, error: null });
        try {
            const data = await api.get('/cis');
            set({ cis: data });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    addCI: async (ciData) => {
        set({ loading: true, error: null });
        try {
            const newCI = await api.post('/cis', ciData);
            set((state) => ({ cis: [...state.cis, newCI] }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    deleteCI: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/cis/${id}`);
            set((state) => ({ cis: state.cis.filter((c) => c.id !== id) }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },
}));
