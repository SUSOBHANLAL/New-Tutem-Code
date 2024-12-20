const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors'); // CORS import

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware setup
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse incoming JSON requests

const dotenv = require("dotenv");

const connectDB = require("./config/db");
connectDB();

// Routes setup
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/vehicle-type/", require("./routes/vehicleTypeRoutes"));
app.use("/api/driver-type/", require("./routes/driverTypeRoutes"));
app.use("/api/driver-vehicle-details", require("./routes/driverVehicleDetailsRoutes"));
app.use("/api/driver-status", require("./routes/driverStatusRoutes"));
app.use("/api/available-drivers", require("./routes/driverRoutes"));
app.use("/api/driver", require("./routes/driverRoutes"));
app.use("/api/ride-request", require("./routes/rideRequestRoutes"));

// Serve static files (if any)
app.use(express.static(path.join(__dirname, 'public')));  // Static folder, if any

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Socket.IO handling for updates
const driverController = require("./controllers/driverController");
const rideRequestController = require("./controllers/rideRequestController");

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for location updates from the client
  socket.on('updateDriverLocation', (data) => {
    driverController.updateDriverLocation(data);
    // Broadcast the updated location to other clients
    socket.broadcast.emit('driverLocationUpdate', data);
  });

   // When a ride request is made, try to find an idle driver
   socket.on('rideRequest', async (data) => {
    console.log('----SERVER JS KA DATA----');
    console.log(data);
    // Call the rideRequestController to handle the logic
    await rideRequestController.createRideRequest(socket, data);
  });

  socket.on('rideAssigned',  (rideDetails) => {
    console.log(`Ride Assigned from User perspective:`, rideDetails);
  });

  socket.on('noDriversAvailable', () => {
    console.log(`Driver is not available: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});




// io.on("connection", (socket) => {
//   console.log(`User connected: ${socket.id}`);

//   // Listen for location updates from the client
//   socket.on("updateLocation", (data) => {
//     driverController.updateLocation(data);
//     // Broadcast the updated location to other clients
//     socket.broadcast.emit("driverLocationUpdate", data);
//   });

//   socket.on('updateLocation', (driverId) => {
//     setInterval(() => driverController.updateLocation(data), 1000);
//     socket.broadcast.emit("driverLocationUpdated", data);
//   });

//   socket.on("disconnect", () => {
//     console.log(`User disconnected: ${socket.id}`);
//   });
// });

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

