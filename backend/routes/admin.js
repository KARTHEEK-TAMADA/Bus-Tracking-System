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
    
    db.get("SELECT id FROM Buses WHERE bus_number = ?", [bus_number], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) return res.status(400).json({ error: 'Bus number already exists' });
      
      if (driver_id) {
        db.get("SELECT role FROM Users WHERE id = ?", [driver_id], (err, user) => {
          if (err) return res.status(500).json({ error: err.message });
          if (!user || user.role !== 'Driver') return res.status(400).json({ error: 'Assigned user is not a Driver' });
          insertBus();
        });
      } else {
        insertBus();
      }

      function insertBus() {
        db.run("INSERT INTO Buses (bus_number, driver_id, route_id, capacity) VALUES (?, ?, ?, ?)",
          [bus_number, driver_id || null, route_id || null, Math.max(1, capacity)], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, bus_number, driver_id, route_id, capacity });
        });
      }
    });
  });

  router.put('/buses/:id', (req, res) => {
    const { bus_number, driver_id, route_id, capacity } = req.body;
    const busId = req.params.id;

    db.get("SELECT id FROM Buses WHERE bus_number = ? AND id != ?", [bus_number, busId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) return res.status(400).json({ error: 'Bus number already exists' });

      if (driver_id) {
        db.get("SELECT role FROM Users WHERE id = ?", [driver_id], (err, user) => {
          if (err) return res.status(500).json({ error: err.message });
          if (!user || user.role !== 'Driver') return res.status(400).json({ error: 'Assigned user is not a Driver' });
          updateBus();
        });
      } else {
        updateBus();
      }

      function updateBus() {
        db.run("UPDATE Buses SET bus_number=?, driver_id=?, route_id=?, capacity=? WHERE id=?",
          [bus_number, driver_id || null, route_id || null, Math.max(1, capacity), busId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Bus updated' });
        });
      }
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

  // Delete a route (cascade)
  router.delete('/routes/:id', (req, res) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("DELETE FROM Stops WHERE route_id = ?", [req.params.id]);
      db.run("UPDATE Buses SET route_id = NULL WHERE route_id = ?", [req.params.id]);
      db.run("DELETE FROM Routes WHERE id = ?", [req.params.id], function(err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }
        db.run("COMMIT");
        res.json({ message: 'Route deleted' });
      });
    });
  });

  // Delete a stop
  router.delete('/stops/:id', (req, res) => {
    db.run("DELETE FROM Stops WHERE id = ?", [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Stop deleted' });
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
