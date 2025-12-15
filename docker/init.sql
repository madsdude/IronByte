CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Replacing auth.users and public.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'agent', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('hardware', 'software', 'network', 'access', 'service-request', 'incident', 'server')),
  created_at timestamptz DEFAULT now()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('new', 'in-progress', 'pending', 'resolved', 'closed')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category text NOT NULL CHECK (category IN ('hardware', 'software', 'network', 'access', 'service-request', 'incident')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  assigned_to uuid REFERENCES users(id),
  submitted_by uuid REFERENCES users(id) NOT NULL,
  due_date timestamptz,
  additional_fields jsonb DEFAULT '{}'::jsonb,
  team_id uuid REFERENCES teams(id)
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('member', 'lead')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

-- Ticket Comments
CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed Data for Admin User
-- ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
-- Email: admin@example.com
INSERT INTO users (id, email, display_name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', 'System Admin');
INSERT INTO user_roles (user_id, role) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin');

-- Seed Data for some sample teams
INSERT INTO teams (name, category) VALUES ('IT Support', 'hardware');
INSERT INTO teams (name, category) VALUES ('Network Ops', 'network');
