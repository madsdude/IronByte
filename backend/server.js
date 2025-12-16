const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

// Auth (Mock)
app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      // Return user ID as the token for our simple middleware
      res.json({ user: result.rows[0], token: result.rows[0].id });
    } else {
      const newUser = await pool.query('INSERT INTO users (email, display_name) VALUES ($1, $2) RETURNING *', [email, email.split('@')[0]]);
      await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [newUser.rows[0].id, 'user']);
      res.json({ user: newUser.rows[0], token: newUser.rows[0].id });
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
      SELECT t.*, u.email as submitted_by_email, a.email as assigned_to_email
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
    res.json(result.rows[0]);
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

    const result = await pool.query(
      `INSERT INTO tickets (title, description, status, priority, category, additional_fields, team_id, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, status, priority, category, additional_fields || {}, team_id, submittedBy]
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
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = ['display_name', 'email'];
        const keys = Object.keys(updates).filter(key => allowedFields.includes(key));
        const values = keys.map(key => updates[key]);

        if (keys.length === 0) return res.json({});

        const fields = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');

        const result = await pool.query(
          `UPDATE users SET ${fields} WHERE id = $1 RETURNING *`,
          [id, ...values]
        );
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

        if (!team_id || !user_id) return res.status(400).json({error: 'Missing team_id or user_id'});

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
