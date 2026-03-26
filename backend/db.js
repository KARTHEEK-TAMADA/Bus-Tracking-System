require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper to match the old db.query interface
const db = {
  query: (text, params) => pool.query(text, params),
};

// Initialize tables
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('Student', 'Driver', 'Admin')) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Routes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        start_origin TEXT,
        end_destination TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Buses (
        id SERIAL PRIMARY KEY,
        bus_number TEXT UNIQUE NOT NULL,
        driver_id INTEGER REFERENCES Users(id),
        route_id INTEGER REFERENCES Routes(id),
        capacity INTEGER
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Stops (
        id SERIAL PRIMARY KEY,
        route_id INTEGER REFERENCES Routes(id),
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        sequence_order INTEGER NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Bus_Location (
        id SERIAL PRIMARY KEY,
        bus_id INTEGER NOT NULL REFERENCES Buses(id),
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Seed Admin User if none exists
    const result = await pool.query("SELECT COUNT(*) as count FROM Users WHERE role = 'Admin'");
    if (parseInt(result.rows[0].count) === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        "INSERT INTO Users (name, email, password, role) VALUES ('Admin User', 'admin@bts.com', $1, 'Admin')",
        [hash]
      );
      console.log("Seeded default Admin user (admin@bts.com / admin123)");
    }

    console.log('Connected to PostgreSQL and tables initialized.');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
}

initDB();

module.exports = db;
