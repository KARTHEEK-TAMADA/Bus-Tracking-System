const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth.js');

module.exports = function(db) {
  const router = express.Router();

  // Middleware to check if user is logged in
  const isAuth = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. Please login.' });

    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      next();
    } catch (err) {
      res.status(400).json({ error: 'Invalid token' });
    }
  };

  // Apply auth to all student routes
  router.use(isAuth);

  // Get all routes
  router.get('/routes', (req, res) => {
    db.all("SELECT * FROM Routes", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // Get stops for a route
  router.get('/routes/:id/stops', (req, res) => {
    db.all("SELECT * FROM Stops WHERE route_id = ? ORDER BY sequence_order ASC", [req.params.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // Get all buses and their current assigned routes
  router.get('/buses', (req, res) => {
    db.all(`
      SELECT b.id, b.bus_number, b.route_id, b.driver_id, r.name as route_name, r.start_origin, r.end_destination 
      FROM Buses b 
      LEFT JOIN Routes r ON b.route_id = r.id
    `, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  return router;
};
