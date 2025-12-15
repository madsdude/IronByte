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

// Middleware to simulate auth (mock user)
app.use((req, res, next) => {
  // For simplicity, we just assume the admin user is logged in
  // In a real app, you'd check a token
  req.user = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', email: 'admin@example.com', role: 'admin' };
  next();
});

// Auth (Mock)
app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body;
  // Simple check: if user exists, log them in
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      res.json({ user: result.rows[0], token: 'mock-token' });
    } else {
      // Create user if not exists (auto-signup for demo)
      const newUser = await pool.query('INSERT INTO users (email) VALUES ($1) RETURNING *', [email]);
      // Assign role
      await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [newUser.rows[0].id, 'user']);
      res.json({ user: newUser.rows[0], token: 'mock-token' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
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
    const result = await pool.query(
      `INSERT INTO tickets (title, description, status, priority, category, additional_fields, team_id, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, status, priority, category, additional_fields || {}, team_id, req.user.id]
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
    const fields = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(updates);

    if (fields.length === 0) return res.json({}); // Nothing to update

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
        const fields = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
        const values = Object.values(updates);

        if (fields.length === 0) return res.json({});

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
        const fields = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
        const values = Object.values(updates);

        if (fields.length === 0) return res.json({});

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
