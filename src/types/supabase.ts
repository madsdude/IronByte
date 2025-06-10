export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string
          title: string
          description: string
          status: 'new' | 'in-progress' | 'pending' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          category: 'hardware' | 'software' | 'network' | 'access' | 'service-request' | 'incident' | 'server'
          created_at: string
          updated_at: string
          assigned_to: string | null
          submitted_by: string
          team_id: string | null
          due_date: string | null
          additional_fields: Json
        }
        Insert: {
          id?: string
          title: string
          description: string
          status: 'new' | 'in-progress' | 'pending' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          category: 'hardware' | 'software' | 'network' | 'access' | 'service-request' | 'incident' | 'server'
          created_at?: string
          updated_at?: string
          assigned_to?: string | null
          submitted_by: string
          team_id?: string | null
          due_date?: string | null
          additional_fields?: Json
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'new' | 'in-progress' | 'pending' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          category?: 'hardware' | 'software' | 'network' | 'access' | 'service-request' | 'incident' | 'server'
          created_at?: string
          updated_at?: string
          assigned_to?: string | null
          submitted_by?: string
          team_id?: string | null
          due_date?: string | null
          additional_fields?: Json
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          category: 'hardware' | 'software' | 'network' | 'access' | 'service-request' | 'incident' | 'server'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'hardware' | 'software' | 'network' | 'access' | 'service-request' | 'incident' | 'server'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'hardware' | 'software' | 'network' | 'access' | 'service-request' | 'incident' | 'server'
          created_at?: string
        }
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
          role: 'member' | 'lead'
          created_at: string
        }
        Insert: {
          team_id: string
          user_id: string
          role: 'member' | 'lead'
          created_at?: string
        }
        Update: {
          team_id?: string
          user_id?: string
          role?: 'member' | 'lead'
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role: 'user' | 'agent' | 'admin'
          created_at: string
        }
        Insert: {
          user_id: string
          role: 'user' | 'agent' | 'admin'
          created_at?: string
        }
        Update: {
          user_id?: string
          role?: 'user' | 'agent' | 'admin'
          created_at?: string
        }
      }
    }
  }
}