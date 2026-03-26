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
  router.post('/routes', async (req, res) => {
    const { name, start_origin, end_destination } = req.body;
    try {
      const result = await db.query(
        "INSERT INTO Routes (name, start_origin, end_destination) VALUES ($1, $2, $3) RETURNING *",
        [name, start_origin, end_destination]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/routes', async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM Routes");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stops Management
  router.post('/stops', async (req, res) => {
    const { route_id, name, latitude, longitude, sequence_order } = req.body;
    try {
      let lat = latitude;
      let lng = longitude;

      // Auto-geocode if lat/lng not provided
      if (!lat || !lng) {
        const searchQuery = encodeURIComponent(name + ', Andhra Pradesh, India');
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&limit=1`, {
          headers: { 'User-Agent': 'VVIT-BTS/1.0' }
        });
        const geoData = await geoRes.json();

        if (geoData.length === 0) {
          return res.status(400).json({ error: `Could not find coordinates for "${name}". Try a more specific name.` });
        }
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }

      const result = await db.query(
        "INSERT INTO Stops (route_id, name, latitude, longitude, sequence_order) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [route_id, name, lat, lng, sequence_order]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/routes/:id/stops', async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM Stops WHERE route_id = $1 ORDER BY sequence_order ASC",
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Buses Management
  router.post('/buses', async (req, res) => {
    const { bus_number, driver_id, route_id, capacity } = req.body;
    try {
      const result = await db.query(
        "INSERT INTO Buses (bus_number, driver_id, route_id, capacity) VALUES ($1, $2, $3, $4) RETURNING *",
        [bus_number, driver_id, route_id, capacity]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/buses', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT b.*, u.name as driver_name, r.name as route_name 
        FROM Buses b 
        LEFT JOIN Users u ON b.driver_id = u.id 
        LEFT JOIN Routes r ON b.route_id = r.id
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Drivers Management
  router.get('/drivers', async (req, res) => {
    try {
      const result = await db.query("SELECT id, name, email FROM Users WHERE role = 'Driver'");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a route
  router.delete('/routes/:id', async (req, res) => {
    try {
      await db.query("DELETE FROM Routes WHERE id = $1", [req.params.id]);
      res.json({ message: 'Route deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a bus
  router.delete('/buses/:id', async (req, res) => {
    try {
      await db.query("DELETE FROM Buses WHERE id = $1", [req.params.id]);
      res.json({ message: 'Bus deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
