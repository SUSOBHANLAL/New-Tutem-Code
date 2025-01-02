// controllers/driverController.js
const DriverLocationStatus = require("../models/DriverLocationStatus");
const FIFOStation = require("../models/FifoStationData");
const Station = require("../models/Station");
const Driver = require("../models/User"); // Import the Driver model

// Add Driver Data
exports.addDriver = async (req, res) => {
  try {
    const { driverId, location, status } = req.body;
    //fifo station chek for 500m
    //if yes, then crete a new collection
    const driver = new DriverLocationStatus({ driverId, location, status });
    await driver.save();
    res.status(201).json({ message: "Driver added successfully", driver });
  } catch (error) {
    res.status(500).json({ message: "Error adding driver", error });
  }
};

// Get Drivers within radius
exports.getDriversWithinRadius = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    const drivers = await DriverLocationStatus.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(radius) / 6378.1, // Radius in radians (meters/6378.1)
          ],
        },
      },
    });

    res.status(200).json({ drivers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching drivers", error });
  }
};

/////////////////////////////////////////////////////////
// FIND DRIVER- NEAREST DRIVER SEARCH & NORMAL SEARCH //
///////////////////////////////////////////////////////

// Helper function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degree) => degree * (Math.PI / 180);

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Find the nearest station and handle fallback to driver search
exports.getNearestFIFOStation = async (req, res) => {
  let nearestStation = null;
  let minDistance = 500;

  // Fetch all stations
  const stations = await Station.find();
  const fifoStations = await FIFOStation.find();
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    // Find the nearest station
    stations.forEach((station) => {
      const [stationLon, stationLat] = station.location.coordinates;
      const distance = calculateDistance(
        latitude,
        longitude,
        stationLat,
        stationLon
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    });

    // If no nearest station, fallback to driver search using normal serach algorithm
    if (!nearestStation) {
      const radius = 5; // Default radius in kilometers
      const driverLocStatuses = await DriverLocationStatus.find({
        location: {
          $geoWithin: {
            $centerSphere: [
              [parseFloat(longitude), parseFloat(latitude)],
              radius / 6378.1, // Radius in radians
            ],
          },
        },
      });

      if (driverLocStatuses.length === 0) {
        return res
          .status(404)
          .json({ message: "No stations or drivers found nearby" });
      }

      return res
        .status(200)
        .json({ message: "Fallback to driver search", driverLocStatuses });
    }

    // Find FIFOStations near the nearest station
    const nearestStationLat = nearestStation.location.coordinates[1];
    const nearestStationLon = nearestStation.location.coordinates[0];
    let nearestFIFOStations = [];
    const fifoSearchRadius = 1; // Adjust radius as needed (in kilometers)

    fifoStations.forEach((fifoStation) => {
      const [fifoLon, fifoLat] = fifoStation.location.coordinates;
      const distanceToFIFO = calculateDistance(
        nearestStationLat,
        nearestStationLon,
        fifoLat,
        fifoLon
      );

      if (distanceToFIFO <= fifoSearchRadius) {
       // Fetch driver details using driverId
       const driverId = fifoStation.driverId;
       const driverData = Driver.findByDriverId(driverId);
        nearestFIFOStations.push({
          fifoStation,
          driverData, // Include driver details here
          distance: distanceToFIFO,
        });
      }
    });

    // Sort FIFOStations by createdAt time (FIFO order: oldest first)
    nearestFIFOStations.sort(
      (a, b) =>
        new Date(a.fifoStation.createdAt) - new Date(b.fifoStation.createdAt)
    );

    res.status(200).json({
      nearestStation,
      stationDistance: minDistance,
      nearestFIFOStations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

exports.getLocationPage = (req, res) => {
  res.render("index");
};
