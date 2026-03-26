const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_bts_key_123';

module.exports = function(db) {
  const router = express.Router();

  // Basic signup for Students and Drivers
  router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    if (!['Student', 'Driver'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role for registration' });
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      const result = await db.query(
        "INSERT INTO Users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
        [name, email, hash, role]
      );
      res.status(201).json({ message: 'User registered successfully', id: result.rows[0].id });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await db.query("SELECT * FROM Users WHERE email = $1", [email]);
      const user = result.rows[0];

      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  return router;
};

module.exports.JWT_SECRET = JWT_SECRET;
