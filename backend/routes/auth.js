const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_bts_key_123';

const authRouter = (db) => {
  const router = express.Router();

  // Basic signup for Students and Drivers (Admin is seeded or added manually)
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
      
      db.run("INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, hash, role], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'User registered successfully', id: this.lastID });
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM Users WHERE email = ?", [email], async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, role: user.role } });
    });
  });

  return router;
};

module.exports = authRouter;
module.exports.JWT_SECRET = JWT_SECRET;
