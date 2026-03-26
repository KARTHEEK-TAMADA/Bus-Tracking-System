const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'bus_tracking.sqlite');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");

    // Clear existing data for a clean seed
    db.run("DELETE FROM Stops");
    db.run("DELETE FROM Buses");
    db.run("DELETE FROM Routes");

    // 1. Seed Routes
    const routes = [
        ['Route 61: Guntur to VVIT', 'Guntur Bus Stand', 'VVIT Campus'],
        ['Route 42: Vijayawada to VVIT', 'Vijayawada PNBS', 'VVIT Campus'],
        ['Route 12: Tenali to VVIT', 'Tenali Tower Clock', 'VVIT Campus']
    ];

    const stmt = db.prepare("INSERT INTO Routes (id, name, start_origin, end_destination) VALUES (?, ?, ?, ?)");
    routes.forEach((r, i) => stmt.run(i + 1, r[0], r[1], r[2]));
    stmt.finalize();

    console.log("Seeded 3 Routes.");

    // 2. Seed Stops for Route 1 (Guntur to VVIT)
    const stopsR1 = [
        [1, 'Guntur Bus Stand', 16.3067, 80.4365, 1],
        [1, 'Lodge Center', 16.3115, 80.4430, 2],
        [1, 'Chuttugunta', 16.3200, 80.4500, 3],
        [1, 'Nambur Gate', 16.3350, 80.5000, 4],
        [1, 'VVIT Campus', 16.3433, 80.5242, 5]
    ];

    const stopStmt = db.prepare("INSERT INTO Stops (route_id, name, latitude, longitude, sequence_order) VALUES (?, ?, ?, ?, ?)");
    stopsR1.forEach(s => stopStmt.run(s));
    stopStmt.finalize();

    console.log("Seeded 5 Stops for Route 1.");

    // 3. Seed Buses
    const buses = [
        ['BUS-01', 2, 1, 40], // driver_id=2 (User 2), route_id=1
        ['BUS-02', 3, 1, 40], // driver_id=3 (User 3), route_id=1
        ['BUS-42', null, 2, 50]
    ];

    const busStmt = db.prepare("INSERT INTO Buses (bus_number, driver_id, route_id, capacity) VALUES (?, ?, ?, ?)");
    buses.forEach(b => busStmt.run(b));
    busStmt.finalize();

    console.log("Seeded 3 Buses.");
});

db.close();
