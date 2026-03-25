const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth.js');

module.exports = function(db) {
  const router = express.Router();

  // Middleware to check Admin role
  const isAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
      const verified = jwt.verify(token, JWT_SECRET);
      if (verified.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
      req.user = verified;
      next();
    } catch (err) {
      res.status(400).json({ error: 'Invalid token' });
    }
  };

  router.use(isAdmin);

  // Routes Management
  router.post('/routes', (req, res) => {
    const { name, start_origin, end_destination } = req.body;
    db.run("INSERT INTO Routes (name, start_origin, end_destination) VALUES (?, ?, ?)", 
      [name, start_origin, end_destination], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, start_origin, end_destination });
    });
  });

  router.get('/routes', (req, res) => {
    db.all("SELECT * FROM Routes", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // Stops Management
  router.post('/stops', (req, res) => {
    const { route_id, name, latitude, longitude, sequence_order } = req.body;
    db.run("INSERT INTO Stops (route_id, name, latitude, longitude, sequence_order) VALUES (?, ?, ?, ?, ?)",
      [route_id, name, latitude, longitude, sequence_order], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, route_id, name, latitude, longitude, sequence_order });
    });
  });

  router.get('/routes/:id/stops', (req, res) => {
    db.all("SELECT * FROM Stops WHERE route_id = ? ORDER BY sequence_order ASC", [req.params.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // Buses Management
  router.post('/buses', (req, res) => {
    const { bus_number, driver_id, route_id, capacity } = req.body;
    db.run("INSERT INTO Buses (bus_number, driver_id, route_id, capacity) VALUES (?, ?, ?, ?)",
      [bus_number, driver_id, route_id, capacity], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, bus_number, driver_id, route_id, capacity });
    });
  });

  router.get('/buses', (req, res) => {
    db.all(`
      SELECT b.*, u.name as driver_name, r.name as route_name 
      FROM Buses b 
      LEFT JOIN Users u ON b.driver_id = u.id 
      LEFT JOIN Routes r ON b.route_id = r.id
    `, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // Drivers Management
  router.get('/drivers', (req, res) => {
    db.all("SELECT id, name, email FROM Users WHERE role = 'Driver'", (err, rows) => {
       if (err) return res.status(500).json({ error: err.message });
       res.json(rows);
    });
  });

  // Delete a route
  router.delete('/routes/:id', (req, res) => {
    db.run("DELETE FROM Routes WHERE id = ?", [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Route deleted' });
    });
  });

  // Delete a bus
  router.delete('/buses/:id', (req, res) => {
    db.run("DELETE FROM Buses WHERE id = ?", [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Bus deleted' });
    });
  });

  return router;
};
