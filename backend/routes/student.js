const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  // Get all routes
  router.get('/routes', async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM Routes");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get stops for a route
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

  // Get all buses and their current assigned routes
  router.get('/buses', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT b.id, b.bus_number, b.route_id, b.driver_id, r.name as route_name, r.start_origin, r.end_destination 
        FROM Buses b 
        LEFT JOIN Routes r ON b.route_id = r.id
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
