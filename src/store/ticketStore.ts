import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Ticket } from '../types';

interface TicketState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  addTicket: (ticket: Partial<Ticket>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
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
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data) {
        set({ tickets: [] });
        return;
      }

      const transformedTickets = data.map(ticket => ({
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
        teamId: ticket.team_id
      }));

      set({ tickets: transformedTickets });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error fetching tickets:', error);
    } finally {
      set({ loading: false });
    }
  },

  addTicket: async (ticket: Partial<Ticket>) => {
    set({ loading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          title: ticket.title,
          description: ticket.description,
          status: ticket.status || 'new',
          priority: ticket.priority,
          category: ticket.category,
          submitted_by: userData.user.id,
          team_id: ticket.teamId,
          additional_fields: ticket.additionalFields || {}
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        throw error;
      }

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
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => 
        dbUpdates[key] === undefined && delete dbUpdates[key]
      );

      const { error } = await supabase
        .from('tickets')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Fetch updated tickets
      await get().fetchTickets();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
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