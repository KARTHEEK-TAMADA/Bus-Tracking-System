require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearData() {
  try {
    await pool.query('DELETE FROM Bus_Location');
    await pool.query('DELETE FROM Stops');
    await pool.query('DELETE FROM Buses');
    await pool.query('DELETE FROM Routes');
    await pool.query("DELETE FROM Users WHERE role != 'Admin'");

    console.log('Cleared: Buses, Routes, Stops, Bus_Location, Students, Drivers');

    const users = await pool.query('SELECT id, name, role FROM Users');
    console.log('Remaining users:', JSON.stringify(users.rows));
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

clearData();
