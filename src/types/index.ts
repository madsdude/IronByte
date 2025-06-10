export type TicketStatus = 'new' | 'in-progress' | 'pending' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type TicketCategory = 
  | 'hardware' 
  | 'software' 
  | 'network' 
  | 'access' 
  | 'service-request'
  | 'incident'
  | 'server';

export type TeamRole = 'member' | 'lead';

export interface Team {
  id: string;
  name: string;
  category: TicketCategory;
  createdAt: string;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  role: TeamRole;
  createdAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
  assigned_to?: string;
  submittedBy: string;
  teamId?: string;
  dueDate?: string;
  additionalFields?: Record<string, string>;
  comments?: TicketComment[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'agent' | 'admin';
  avatar?: string;
}

export interface MetricData {
  name: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease';
}