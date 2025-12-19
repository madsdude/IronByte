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

export type ChangeType = 'standard' | 'normal' | 'emergency';

export type ChangeStatus = 'draft' | 'requested' | 'approved' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

export interface Change {
  id: string;
  title: string;
  description: string;
  type: ChangeType;
  status: ChangeStatus;
  priority: TicketPriority;
  risk: 'low' | 'medium' | 'high';
  impact: string;
  backout_plan?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  requested_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  requestor_name?: string;
  approver_name?: string;
  assigned_approver_id?: string;
  assigned_approver_name?: string;
}