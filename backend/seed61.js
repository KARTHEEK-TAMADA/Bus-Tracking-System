require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  try {
    // Clear existing data for a clean seed
    await pool.query("DELETE FROM Stops");
    await pool.query("DELETE FROM Buses");
    await pool.query("DELETE FROM Routes");

    // 1. Seed Routes
    const routes = [
      ['Route 61: Guntur to VVIT', 'Guntur Bus Stand', 'VVIT Campus'],
      ['Route 42: Vijayawada to VVIT', 'Vijayawada PNBS', 'VVIT Campus'],
      ['Route 12: Tenali to VVIT', 'Tenali Tower Clock', 'VVIT Campus']
    ];

    for (let i = 0; i < routes.length; i++) {
      await pool.query(
        "INSERT INTO Routes (id, name, start_origin, end_destination) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
        [i + 1, routes[i][0], routes[i][1], routes[i][2]]
      );
    }
    // Reset the sequence so future inserts get the right IDs
    await pool.query("SELECT setval('routes_id_seq', (SELECT MAX(id) FROM Routes))");
    console.log("Seeded 3 Routes.");

    // 2. Seed Stops for Route 1 (Guntur to VVIT)
    const stopsR1 = [
      [1, 'Guntur Bus Stand', 16.3067, 80.4365, 1],
      [1, 'Lodge Center', 16.3115, 80.4430, 2],
      [1, 'Chuttugunta', 16.3200, 80.4500, 3],
      [1, 'Nambur Gate', 16.3350, 80.5000, 4],
      [1, 'VVIT Campus', 16.3433, 80.5242, 5]
    ];

    for (const s of stopsR1) {
      await pool.query(
        "INSERT INTO Stops (route_id, name, latitude, longitude, sequence_order) VALUES ($1, $2, $3, $4, $5)",
        s
      );
    }
    console.log("Seeded 5 Stops for Route 1.");

    // 3. Seed Buses
    const buses = [
      ['BUS-01', null, 1, 40],
      ['BUS-02', null, 1, 40],
      ['BUS-42', null, 2, 50]
    ];

    for (const b of buses) {
      await pool.query(
        "INSERT INTO Buses (bus_number, driver_id, route_id, capacity) VALUES ($1, $2, $3, $4)",
        b
      );
    }
    console.log("Seeded 3 Buses.");

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seeding error:", err.message);
  } finally {
    await pool.end();
  }
}

seed();
