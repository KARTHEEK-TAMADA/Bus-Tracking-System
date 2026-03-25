const express = require('express');

module.exports = function(db) {
  const router = express.Router();

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
