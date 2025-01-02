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

//Models
const DriverLocationStatus = require("./models/DriverLocationStatus");
const FifoStationData = require("./models/FifoStationData");
const Station = require("./models/Station"); // Import the Station model

// Routes setup
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/vehicle-type/", require("./routes/vehicleTypeRoutes"));
app.use("/api/driver-type/", require("./routes/driverTypeRoutes"));
app.use("/api/driver-vehicle-details", require("./routes/driverVehicleDetailsRoutes"));
//app.use("/api/driver-status", require("./routes/driverStatusRoutes"));
app.use("/api/available-drivers", require("./routes/driverRoutes"));
app.use("/api/driver", require("./routes/driverRoutes"));
app.use("/api/ride-request", require("./routes/rideRequestRoutes"));
app.use("/api/stations", require("./routes/stationRoutes"));

// Serve static files (if any)
app.use(express.static(path.join(__dirname, 'public')));  // Static folder, if any

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Socket.IO handling for updates
const driverController = require("./controllers/driverController");
const rideRequestController = require("./controllers/rideRequestController");


// Render Main Page
app.get("/", (req, res) => {
  res.render("index");
});

// Haversine formula to calculate distance between two lat/lng points
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => deg * (Math.PI / 180);
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
};


io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  ///////////////////////// START //////////////////////////////////////
  // Handle Nearest Driver Search for FIO and Normal Search ///////////
 
  socket.on("addRandomDriver", async (data) => {
    try {
      const { latitude, longitude, driverId } = data; // Include driverId from client if available
      console.log("driver data is ", data);

      // Check if the driver already exists in either FifoStationData or DriverLocationStatus collection
      let existingDriver = await FifoStationData.findOne({ driverId });
      if (!existingDriver) {
        existingDriver = await DriverLocationStatus.findOne({ driverId });
      }

      if (existingDriver) {
        // Update the driver's coordinates
        existingDriver.location = {
          type: "Point",
          coordinates: [longitude, latitude],
        };

        // Save the updated driver document
        await existingDriver.save();

        console.log("Nearest Driver's location updated:", existingDriver);

        // Emit the updated driver
        io.emit("driverUpdated", existingDriver);
      } else {
        // Fetch all stations from the database
        const stations = await Station.find();

        // Find the nearest station
        let nearestStation = null;
        let minDistance = Infinity;
        let arrivalTime = null;

        // Loop through each station to find the nearest one
        stations.forEach((station) => {
          // Ensure the station has a location and coordinates
          if (station.location && station.location.coordinates) {
            const distanceToStation = haversineDistance(
              latitude,
              longitude,
              station.location.coordinates[1], // Longitude
              station.location.coordinates[0] // Latitude
            );

            // Check if the driver is within 500 meters of a station
            if (distanceToStation <= 500 && distanceToStation < minDistance) {
              nearestStation = station;
              minDistance = distanceToStation;
              arrivalTime = new Date(); // Set arrival time to current time when the driver reaches the station
            }
          } else {
            console.log(
              `Station location or coordinates missing for station: ${station.stationName}`
            );
          }
        });

        if (nearestStation) {
          console.log("Driver is near a station.", nearestStation);
          console.log("Distance to nearest station:", minDistance);
          console.log("Arrival Time:", arrivalTime);

          // Add driver data to the station with arrival time
          const newDriver = new FifoStationData({
            driverId:
              driverId || `driver-${Math.random().toString(36).substr(2, 5)}`, // Use provided driverId or generate a new one
            location: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            stationName: nearestStation.stationName,
            status: "idle",
            stationId: nearestStation.stationId, // Link driver with the station
            arrivalTime: arrivalTime, // Set the arrival time when the driver reaches the station
          });

          await newDriver.save();

          // Emit the newly added driver with station details
          io.emit("driverNearestAdded", {
            driver: newDriver,
            station: nearestStation,
          });
        } else {
          // If no station is within 500 meters, save the driver to the DriverLocationStatus table
          const newDriver = new DriverLocationStatus({
            driverId:
              driverId || `driver-${Math.random().toString(36).substr(2, 5)}`, // Use provided driverId or generate a new one
            location: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            status: "idle",
          });

          await newDriver.save();

          // Emit the newly added driver
          io.emit("driverAdded", newDriver);
        }
      }
    } catch (error) {
      console.error("Error adding or updating driver:", error);
    }
  });
  ///////////////////////// END DRIVER SEARCH ///////////////////////////////// 



  // Listen for location updates from the client
  socket.on('updateDriverLocation', (data) => {
    driverController.updateDriverLocation(data);
    // Broadcast the updated location to other clients
    socket.broadcast.emit('driverLocationUpdate', data);
  });

  ///////////////////////// START RIDE REQUEST ///////////////////////////////// 
  // When a ride request is made, try to find an idle driver //////////////////
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
///////////////////////// END RIDE REQUEST ///////////////////////////////// 


// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

