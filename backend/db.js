const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'bus_tracking.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Tables
    db.run(`CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('Student', 'Driver', 'Admin')) NOT NULL
    )`, (err) => {
      if (!err) {
        // Seed Admin User
        db.get("SELECT COUNT(*) as count FROM Users WHERE role = 'Admin'", async (err, row) => {
          if (row.count === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            db.run("INSERT INTO Users (name, email, password, role) VALUES ('Admin User', 'admin@bts.com', ?, 'Admin')", [hash]);
            console.log("Seeded default Admin user (admin@bts.com / admin123)");
          }
        });
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS Routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_origin TEXT,
      end_destination TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Buses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_number TEXT UNIQUE NOT NULL,
      driver_id INTEGER,
      route_id INTEGER,
      capacity INTEGER,
      FOREIGN KEY (driver_id) REFERENCES Users(id),
      FOREIGN KEY (route_id) REFERENCES Routes(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      sequence_order INTEGER NOT NULL,
      FOREIGN KEY (route_id) REFERENCES Routes(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Bus_Location (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bus_id) REFERENCES Buses(id)
    )`);
  }
});

module.exports = db;
