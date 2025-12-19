import { create } from 'zustand';
import { api } from '../lib/api';

export interface KBArticle {
    id: string;
    title: string;
    content: string;
    category: string;
    author_id: string;
    author_name?: string;
    author_email?: string;
    created_at: string;
    updated_at: string;
}

interface KBState {
    articles: KBArticle[];
    loading: boolean;
    error: string | null;
    fetchArticles: (search?: string) => Promise<void>;
    addArticle: (data: Partial<KBArticle>) => Promise<void>;
    updateArticle: (id: string, data: Partial<KBArticle>) => Promise<void>;
    deleteArticle: (id: string) => Promise<void>;
}

export const useKBStore = create<KBState>((set) => ({
    articles: [],
    loading: false,
    error: null,

    fetchArticles: async (search) => {
        set({ loading: true, error: null });
        try {
            const endpoint = search ? `/kb?search=${encodeURIComponent(search)}` : '/kb';
            const articles = await api.get(endpoint);
            set({ articles, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    addArticle: async (data) => {
        set({ loading: true, error: null });
        try {
            const newArticle = await api.post('/kb', data);
            set((state) => ({
                articles: [newArticle, ...state.articles],
                loading: false
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateArticle: async (id, data) => {
        set({ loading: true, error: null });
        try {
            const updatedArticle = await api.put(`/kb/${id}`, data);
            set((state) => ({
                articles: state.articles.map((a) => (a.id === id ? updatedArticle : a)),
                loading: false
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteArticle: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/kb/${id}`);
            set((state) => ({
                articles: state.articles.filter((a) => a.id !== id),
                loading: false
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
}));
