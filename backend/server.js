const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Import DB
const db = require('./db.js');

// Store active driver sockets mapping: driverId -> socketId
const driverSockets = new Map();
const socketToDriver = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Driver registers their session
  socket.on('driver_start_trip', (data) => {
    const { driverId, busId } = data;
    if (driverId && busId) {
      driverSockets.set(driverId, { socketId: socket.id, busId });
      socketToDriver.set(socket.id, driverId);
      console.log(`Driver ${driverId} started trip for bus ${busId}`);
      // Notify everyone that the bus is now live
      io.emit('bus_location_update', { busId, status: 'live' });
    }
  });

  // Driver sends live location
  socket.on('driver_update_location', (data) => {
    const { driverId, busId, lat, lng } = data;
    
    // Broadcast to all clients (Students & Admins)
    io.emit('bus_location_update', { busId, lat, lng, timestamp: Date.now() });
  });

  const handleStopTrip = (socketId) => {
    const driverId = socketToDriver.get(socketId);
    if (driverId) {
      const session = driverSockets.get(driverId);
      if (session) {
        // Broadcast that the trip has ended
        io.emit('bus_location_update', { busId: session.busId, status: 'ended' });
        driverSockets.delete(driverId);
      }
      socketToDriver.delete(socketId);
      console.log(`Driver ${driverId} trip session cleaned up`);
    }
  };

  socket.on('driver_stop_trip', () => {
    handleStopTrip(socket.id);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    handleStopTrip(socket.id);
  });
});

// Import Routes
const authRoutes = require('./routes/auth.js')(db);
const adminRoutes = require('./routes/admin.js')(db);
const studentRoutes = require('./routes/student.js')(db);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
