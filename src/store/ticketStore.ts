import { create } from 'zustand';
import { api } from '../lib/api';

// Ticket type simplified
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'in-progress' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'hardware' | 'software' | 'network' | 'access' | 'service-request' | 'incident' | 'server';
  createdAt: string;
  updatedAt: string;
  assigned_to?: string | null;
  submittedBy: string;
  dueDate?: string | null;
  additionalFields?: Record<string, any> | null;
  teamId?: string | null;
  cis?: any[];
  sla_due_at?: string;
  linked_problem?: {
    id: string;
    title: string;
    status: string;
  };
}

interface TicketState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  fetchTicket: (id: string) => Promise<void>;
  addTicket: (ticket: Partial<Ticket>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  linkCI: (ticketId: string, ciId: string) => Promise<void>;
  unlinkCI: (ticketId: string, ciId: string) => Promise<void>;
  getMetrics: () => {
    openTickets: number;
    resolvedToday: number;
    avgResponseTime: number;
    slaCompliance: number;
  };
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  loading: false,
  error: null,

  fetchTickets: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get('/tickets');

      if (!data) {
        set({ tickets: [] });
        return;
      }

      const transformedTickets = data.map((ticket: any) => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        assigned_to: ticket.assigned_to,
        submittedBy: ticket.submitted_by,
        dueDate: ticket.due_date,
        additionalFields: ticket.additional_fields,
        teamId: ticket.team_id,
        cis: ticket.cis || []
      }));

      set({ tickets: transformedTickets });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error fetching tickets:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchTicket: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await api.get(`/tickets/${id}`);

      const transformedTicket = {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        category: data.category,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        assigned_to: data.assigned_to_email || data.assigned_to,
        submittedBy: data.submitted_by_email || data.submitted_by || 'Unknown',
        dueDate: data.due_date,
        additionalFields: data.additional_fields,
        teamId: data.team_id,
        cis: data.cis || [],
        linked_problem: data.linked_problem,
        sla_due_at: data.sla_due_at
      };

      set((state) => {
        const index = state.tickets.findIndex(t => t.id === id);
        if (index >= 0) {
          const newTickets = [...state.tickets];
          newTickets[index] = transformedTicket;
          return { tickets: newTickets, loading: false };
        } else {
          return { tickets: [...state.tickets, transformedTicket], loading: false };
        }
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addTicket: async (ticket: Partial<Ticket>) => {
    set({ loading: true, error: null });
    try {
      // API handles user from token/session (in this case mocked)
      const data = await api.post('/tickets', {
        title: ticket.title,
        description: ticket.description,
        status: ticket.status || 'new',
        priority: ticket.priority,
        category: ticket.category,
        // submitted_by handled by backend
        team_id: ticket.teamId,
        additional_fields: ticket.additionalFields || {}
      });

      if (!data) {
        throw new Error('No data returned from ticket creation');
      }

      const newTicket = {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        category: data.category,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        assigned_to: data.assigned_to,
        submittedBy: data.submitted_by,
        dueDate: data.due_date,
        additionalFields: data.additional_fields,
        teamId: data.team_id
      };

      set(state => ({
        tickets: [newTicket, ...state.tickets]
      }));

      return data;
    } catch (error: any) {
      console.error('Error in addTicket:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTicket: async (id: string, updates: Partial<Ticket>) => {
    set({ loading: true, error: null });
    try {
      const dbUpdates: any = {
        assigned_to: updates.assigned_to,
        status: updates.status,
        priority: updates.priority,
        title: updates.title,
        description: updates.description,
        category: updates.category,
        due_date: updates.dueDate,
        additional_fields: updates.additionalFields,
        team_id: updates.teamId,
        // updated_at handled by backend
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key =>
        dbUpdates[key] === undefined && delete dbUpdates[key]
      );

      await api.patch(`/tickets/${id}`, dbUpdates);

      // Fetch updated tickets
      await get().fetchTickets();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  linkCI: async (ticketId, ciId) => {
    try {
      await api.post(`/tickets/${ticketId}/cis`, { ciId });
      // Reload tickets to get updated CIs
      await get().fetchTickets();
    } catch (error: any) {
      console.error('Failed to link CI', error);
      set({ error: error.message });
      throw error;
    }
  },

  unlinkCI: async (ticketId, ciId) => {
    try {
      await api.delete(`/tickets/${ticketId}/cis/${ciId}`);
      // Reload tickets
      await get().fetchTickets();
    } catch (error: any) {
      console.error('Failed to unlink CI', error);
      set({ error: error.message });
      throw error;
    }
  },

  getMetrics: () => {
    const tickets = get().tickets;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const openTickets = tickets.filter(ticket =>
      ticket.status !== 'closed' && ticket.status !== 'resolved'
    ).length;

    const resolvedToday = tickets.filter(ticket => {
      const updatedAt = new Date(ticket.updatedAt);
      return ticket.status === 'resolved' &&
        updatedAt >= today;
    }).length;

    // These could be calculated from actual data in a production environment
    const avgResponseTime = 24;
    const slaCompliance = 95;

    return {
      openTickets,
      resolvedToday,
      avgResponseTime,
      slaCompliance
    };
  }
}));
