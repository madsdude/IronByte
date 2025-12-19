const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Auto-migration for Configuration Items
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuration_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL, -- e.g., 'server', 'application', 'router'
        status VARCHAR(50) DEFAULT 'active',
        description TEXT,
        location VARCHAR(100),
        owner_id UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ticket_cis (
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        ci_id UUID REFERENCES configuration_items(id) ON DELETE CASCADE,
        PRIMARY KEY (ticket_id, ci_id)
      );

      /* Add SLA column if not exists */
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='sla_due_at') THEN
              ALTER TABLE tickets ADD COLUMN sla_due_at TIMESTAMP WITH TIME ZONE;
          END IF;
      END
      $$;

      CREATE TABLE IF NOT EXISTS problems (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        root_cause TEXT,
        resolution TEXT,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS problem_tickets (
        problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        PRIMARY KEY (problem_id, ticket_id)
      );

      CREATE TABLE IF NOT EXISTS kb_articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100),
        author_id UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS changes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL, -- standard, normal, emergency
        status VARCHAR(50) DEFAULT 'draft', -- draft, requested, approved, in-progress, completed, failed, cancelled
        priority VARCHAR(50) DEFAULT 'low',
        risk VARCHAR(50) DEFAULT 'low',
        impact TEXT,
        backout_plan TEXT,
        scheduled_start TIMESTAMP WITH TIME ZONE,
        scheduled_end TIMESTAMP WITH TIME ZONE,
        requested_by UUID REFERENCES users(id),
        approved_by UUID REFERENCES users(id),
        assigned_approver_id UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS change_cis (
        change_id UUID REFERENCES changes(id) ON DELETE CASCADE,
        ci_id UUID REFERENCES configuration_items(id) ON DELETE CASCADE,
        PRIMARY KEY (change_id, ci_id)
      );

      CREATE TABLE IF NOT EXISTS change_problems (
        change_id UUID REFERENCES changes(id) ON DELETE CASCADE,
        problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
        PRIMARY KEY (change_id, problem_id)
      );
    `);
    console.log('Database tables verified/created');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
};
initDb();

// Simple validation function to prevent SQL injection in keys
const isValidKey = (key) => /^[a-zA-Z0-9_]+$/.test(key);

// Middleware to simulate auth (mock user)
app.use(async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Simple mock: we expect the token to be the user ID directly for this demo migration
    // In production, this must be a JWT verify
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [token]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        // Fetch role
        const roleResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
        user.role = roleResult.rows.length > 0 ? roleResult.rows[0].role : 'user';
        req.user = user;
      }
    } catch (err) {
      console.error("Auth error", err);
    }
  }
  next();
});

// Auth (Mock -> Secure)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Migration strategy: If user has no password set (null), set it to the provided one (hashed)
      if (!user.password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);

        // Fetch role
        const roleResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
        user.role = roleResult.rows.length > 0 ? roleResult.rows[0].role : 'user';
        return res.json({ user, token: user.id });
      }

      // Verify password
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const roleResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
        user.role = roleResult.rows.length > 0 ? roleResult.rows[0].role : 'user';
        res.json({ user, token: user.id });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // Create new user (Sign Up flow integrated)
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await pool.query('INSERT INTO users (email, display_name, password) VALUES ($1, $2, $3) RETURNING *', [email, email.split('@')[0], hashedPassword]);
      await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [newUser.rows[0].id, 'user']);
      const user = newUser.rows[0];
      user.role = 'user';
      res.json({ user, token: user.id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: req.user });
});

// Tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.email as submitted_by_email, a.email as assigned_to_email,
             COALESCE(
               (SELECT json_agg(ci.*)
                FROM configuration_items ci
                JOIN ticket_cis tc ON ci.id = tc.ci_id
                WHERE tc.ticket_id = t.id
               ), '[]'
             ) as cis
      FROM tickets t
      LEFT JOIN users u ON t.submitted_by = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const ticket = result.rows[0];

    // Fetch linked CIs
    const ciResult = await pool.query(`
      SELECT ci.* 
      FROM configuration_items ci
      JOIN ticket_cis tc ON ci.id = tc.ci_id
      WHERE tc.ticket_id = $1
    `, [id]);
    ticket.cis = ciResult.rows;

    // Fetch linked Problem
    const problemResult = await pool.query(`
      SELECT p.id, p.title, p.status
      FROM problems p
      JOIN problem_tickets pt ON p.id = pt.problem_id
      WHERE pt.ticket_id = $1
      LIMIT 1
    `, [id]);

    if (problemResult.rows.length > 0) {
      ticket.linked_problem = problemResult.rows[0];
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const { title, description, status, priority, category, additional_fields, team_id } = req.body;

    let submittedBy = req.user ? req.user.id : null;

    if (!submittedBy) {
      const contactEmail = additional_fields?.contact_email;
      if (contactEmail) {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [contactEmail]);
        if (userResult.rows.length > 0) {
          submittedBy = userResult.rows[0].id;
        } else {
          const newUser = await pool.query('INSERT INTO users (email, display_name) VALUES ($1, $2) RETURNING id', [contactEmail, contactEmail.split('@')[0]]);
          submittedBy = newUser.rows[0].id;
          await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [submittedBy, 'user']);
        }
      } else {
        // If no email provided for public ticket, we can't create it according to schema constraint NOT NULL
        // Fallback to admin or throw error
        const admin = await pool.query("SELECT id FROM users WHERE email = 'admin@example.com'");
        if (admin.rows.length > 0) submittedBy = admin.rows[0].id;
      }
    }

    // SLA Calculation
    let slaDueAt = null;
    const now = new Date();
    // Normalize priority to match case-insensitive or schema
    const normalizedPriority = priority ? priority.toLowerCase() : 'medium';

    switch (normalizedPriority) {
      case 'critical':
        slaDueAt = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 Hour
        break;
      case 'high':
        slaDueAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 Hours
        break;
      case 'medium':
        slaDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 Hours
        break;
      case 'low':
        slaDueAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 Hours
        break;
      default:
        slaDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to Medium
    }

    const result = await pool.query(
      `INSERT INTO tickets (title, description, status, priority, category, additional_fields, team_id, submitted_by, sla_due_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, status, normalizedPriority, category, additional_fields || {}, team_id, submittedBy, slaDueAt]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Whitelist allowed fields or check key validity
    const allowedFields = ['title', 'description', 'status', 'priority', 'category', 'assigned_to', 'due_date', 'additional_fields', 'team_id'];
    const keys = Object.keys(updates).filter(key => allowedFields.includes(key));
    const values = keys.map(key => updates[key]);

    if (keys.length === 0) return res.json({});

    const fields = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');

    const result = await pool.query(
      `UPDATE tickets SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM ticket_comments WHERE ticket_id = $1', [id]);
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comments
app.get('/api/tickets/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, u.email as user_email
         FROM ticket_comments c
         JOIN users u ON c.user_id = u.id
         WHERE ticket_id = $1
         ORDER BY created_at ASC`, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets/:id/comments', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = req.params;
    const { content } = req.body;
    const result = await pool.query(
      `INSERT INTO ticket_comments (ticket_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [id, req.user.id, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT u.*, ur.role 
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id
        `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Handle role update separately if present
    if (updates.role) {
      // Check if user has a role entry
      const roleCheck = await pool.query('SELECT * FROM user_roles WHERE user_id = $1', [id]);
      if (roleCheck.rows.length > 0) {
        await pool.query('UPDATE user_roles SET role = $1 WHERE user_id = $2', [updates.role, id]);
      } else {
        await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [id, updates.role]);
      }
    }

    const allowedFields = ['display_name', 'email'];
    const keys = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (keys.length > 0) {
      const values = keys.map(key => updates[key]);
      const fields = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');

      await pool.query(
        `UPDATE users SET ${fields} WHERE id = $1`,
        [id, ...values]
      );
    }

    // Return updated user with role
    const result = await pool.query(`
            SELECT u.*, ur.role 
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = $1
        `, [id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teams
app.get('/api/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { name, category } = req.body;
    const result = await pool.query(
      'INSERT INTO teams (name, category) VALUES ($1, $2) RETURNING *',
      [name, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['name', 'category'];
    const keys = Object.keys(updates).filter(key => allowedFields.includes(key));
    const values = keys.map(key => updates[key]);

    if (keys.length === 0) return res.json({});

    const fields = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');

    const result = await pool.query(
      `UPDATE teams SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Team Members
app.get('/api/team-members', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM team_members');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/team-members', async (req, res) => {
  try {
    const { team_id, user_id, role } = req.body;
    const result = await pool.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [team_id, user_id, role]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/team-members', async (req, res) => {
  try {
    const team_id = req.query.team_id;
    const user_id = req.query.user_id;

    if (!team_id || !user_id) return res.status(400).json({ error: 'Missing team_id or user_id' });

    await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [team_id, user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/team-members', async (req, res) => {
  try {
    const { team_id, user_id, role } = req.body;
    const result = await pool.query(
      'UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3 RETURNING *',
      [role, team_id, user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // 1. Delete comments made by user
    await client.query('DELETE FROM ticket_comments WHERE user_id = $1', [id]);

    // 2. Remove from teams
    await client.query('DELETE FROM team_members WHERE user_id = $1', [id]);

    // 3. Remove roles
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

    // 4. Delete tickets submitted by user (Since submitted_by is NOT NULL)
    // First delete comments on those tickets
    await client.query(`
      DELETE FROM ticket_comments 
      WHERE ticket_id IN (SELECT id FROM tickets WHERE submitted_by = $1)
    `, [id]);

    await client.query('DELETE FROM tickets WHERE submitted_by = $1', [id]);

    // 5. Unassign tickets assigned to user
    await client.query('UPDATE tickets SET assigned_to = NULL WHERE assigned_to = $1', [id]);

    // 6. Delete the user
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    await client.query('COMMIT');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, deletedUser: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Configuration Items (CIs)
app.get('/api/cis', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM configuration_items ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cis', async (req, res) => {
  try {
    const { name, type, status, description, location } = req.body;
    const result = await pool.query(
      `INSERT INTO configuration_items (name, type, status, description, location, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, type, status || 'active', description, location, req.user ? req.user.id : null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM configuration_items WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Link CI to Ticket
app.post('/api/tickets/:id/cis', async (req, res) => {
  try {
    const { id } = req.params;
    const { ciId } = req.body;
    await pool.query(
      'INSERT INTO ticket_cis (ticket_id, ci_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, ciId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unlink CI from Ticket
app.delete('/api/tickets/:id/cis/:ciId', async (req, res) => {
  try {
    const { id, ciId } = req.params;
    console.log(`Unlinking CI ${ciId} from ticket ${id}`);
    const result = await pool.query(
      'DELETE FROM ticket_cis WHERE ticket_id = $1 AND ci_id = $2 RETURNING *',
      [id, ciId]
    );
    console.log('Unlink result:', result.rowCount);
    if (result.rowCount === 0) {
      console.warn('No rows deleted. Check ids.');
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Unlink error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Knowledge Base
app.get('/api/kb', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT kb.*, u.display_name as author_name, u.email as author_email
      FROM kb_articles kb
      LEFT JOIN users u ON kb.author_id = u.id
    `;
    const params = [];

    if (search) {
      query += ` WHERE kb.title ILIKE $1 OR kb.content ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY kb.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/kb/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT kb.*, u.display_name as author_name, u.email as author_email
      FROM kb_articles kb
      LEFT JOIN users u ON kb.author_id = u.id
      WHERE kb.id = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Article not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kb', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { title, content, category } = req.body;
    const result = await pool.query(
      `INSERT INTO kb_articles (title, content, category, author_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, content, category, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/kb/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;

    // Check ownership or admin role (omitted for speed, simple update)
    const result = await pool.query(
      `UPDATE kb_articles 
       SET title = COALESCE($1, title), 
           content = COALESCE($2, content), 
           category = COALESCE($3, category),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [title, content, category, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Article not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/kb/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM kb_articles WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Article not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Problems API
app.get('/api/problems', async (req, res) => {
  try {
    // Get problems with ticket counts
    const result = await pool.query(`
      SELECT p.*, COUNT(pt.ticket_id) as ticket_count 
      FROM problems p 
      LEFT JOIN problem_tickets pt ON p.id = pt.problem_id 
      GROUP BY p.id 
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/problems', async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await pool.query(
      'INSERT INTO problems (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/problems/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await pool.query('SELECT * FROM problems WHERE id = $1', [id]);

    if (problem.rows.length === 0) return res.status(404).json({ error: 'Problem not found' });

    // Get linked tickets
    const tickets = await pool.query(`
      SELECT t.* 
      FROM tickets t
      JOIN problem_tickets pt ON t.id = pt.ticket_id
      WHERE pt.problem_id = $1
    `, [id]);

    res.json({ ...problem.rows[0], tickets: tickets.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/problems/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, root_cause, resolution, status } = req.body;

    const result = await pool.query(
      `UPDATE problems 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           root_cause = COALESCE($3, root_cause), 
           resolution = COALESCE($4, resolution), 
           status = COALESCE($5, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [title, description, root_cause, resolution, status, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Problem not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/problems/:id/tickets', async (req, res) => {
  try {
    const { id } = req.params;
    const { ticketId } = req.body;
    await pool.query(
      'INSERT INTO problem_tickets (problem_id, ticket_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, ticketId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/problems/:id/tickets/:ticketId', async (req, res) => {
  try {
    const { id, ticketId } = req.params;
    await pool.query(
      'DELETE FROM problem_tickets WHERE problem_id = $1 AND ticket_id = $2',
      [id, ticketId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/problems/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM problems WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Problem not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/problems/:id/resolve', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // 1. Update Problem status to resolved
    const problemResult = await client.query(
      `UPDATE problems 
       SET status = 'resolved', resolution = 'Resolved via cascade', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (problemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Problem not found' });
    }

    // 2. Find all linked tickets
    const linkedTickets = await client.query(
      'SELECT ticket_id FROM problem_tickets WHERE problem_id = $1',
      [id]
    );

    // 3. Resolve all linked tickets
    for (const row of linkedTickets.rows) {
      await client.query(
        `UPDATE tickets SET status = 'resolved' WHERE id = $1 AND status != 'closed'`,
        [row.ticket_id]
      );
    }

    await client.query('COMMIT');
    res.json(problemResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Change Management API
app.get('/api/changes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.display_name as requestor_name, a.display_name as approver_name, aa.display_name as assigned_approver_name
      FROM changes c
      LEFT JOIN users u ON c.requested_by = u.id
      LEFT JOIN users a ON c.approved_by = a.id
      LEFT JOIN users aa ON c.assigned_approver_id = aa.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/changes', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { title, description, type, priority, risk, impact, backout_plan, scheduled_start, scheduled_end, assigned_approver_id } = req.body;

    const approverId = assigned_approver_id === '' ? null : assigned_approver_id;

    const result = await pool.query(
      `INSERT INTO changes (
        title, description, type, priority, risk, impact, backout_plan, 
        scheduled_start, scheduled_end, requested_by, status, assigned_approver_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'requested', $11) RETURNING *`,
      [title, description, type, priority, risk, impact, backout_plan, scheduled_start, scheduled_end, req.user.id, approverId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/changes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT c.*, u.display_name as requestor_name, u.email as requestor_email,
             a.display_name as approver_name, aa.display_name as assigned_approver_name
      FROM changes c
      LEFT JOIN users u ON c.requested_by = u.id
      LEFT JOIN users a ON c.approved_by = a.id
      LEFT JOIN users aa ON c.assigned_approver_id = aa.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Change not found' });

    const change = result.rows[0];

    // Fetch linked CIs
    const cis = await pool.query(`
      SELECT ci.* FROM configuration_items ci
      JOIN change_cis cc ON ci.id = cc.ci_id
      WHERE cc.change_id = $1
    `, [id]);
    change.cis = cis.rows;

    // Fetch linked Problems
    const problems = await pool.query(`
      SELECT p.* FROM problems p
      JOIN change_problems cp ON p.id = cp.problem_id
      WHERE cp.change_id = $1
    `, [id]);
    change.problems = problems.rows;

    res.json(change);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/changes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Whitelist fields
    const allowedFields = ['title', 'description', 'type', 'status', 'priority', 'risk', 'impact', 'backout_plan', 'scheduled_start', 'scheduled_end', 'approved_by', 'assigned_approver_id'];
    const keys = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (keys.length === 0) return res.json({});

    const values = keys.map(key => updates[key]);
    const fields = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');

    const result = await pool.query(
      `UPDATE changes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Change not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/changes/:id/cis', async (req, res) => {
  try {
    const { id } = req.params;
    const { ciId } = req.body;
    await pool.query(
      'INSERT INTO change_cis (change_id, ci_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, ciId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/changes/:id/cis/:ciId', async (req, res) => {
  try {
    const { id, ciId } = req.params;
    await pool.query(
      'DELETE FROM change_cis WHERE change_id = $1 AND ci_id = $2',
      [id, ciId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/changes/:id/problems', async (req, res) => {
  try {
    const { id } = req.params;
    const { problemId } = req.body;
    await pool.query(
      'INSERT INTO change_problems (change_id, problem_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, problemId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
