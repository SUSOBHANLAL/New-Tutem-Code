// controllers/driverController.js
const Driver = require("../models/DriverLocationStatus");

exports.updateDriverLocation = async (data) => {
  try {
    console.log("Into driver location update controller");
    const { driverId, latitude, longitude, status } = data;

    // Update driver location if exists, or create a new entry
    const driver = await Driver.findOneAndUpdate(
      { driverId },
      { latitude, longitude, status, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log("Driver location updated:", driver);
  } catch (error) {
    console.error("Error updating driver location:", error);
  }
};

exports.getLocationPage = (req, res) => {
  res.render("index");
};

// Function to get nearest drivers within multiple distances
exports.getNearestDrivers = async (
  req,
  res,
  distances = [50, 100, 500, 1000, 5000]
) => {
  try {
    const db = await connectDB();
    const collection = db.collection("users");
    const drivers = await collection.find({ role: "driver" }).toArray();

    const { lat, long } = req.query;
    // Convert lat and long to numbers
    const originLat = parseFloat(lat);
    const originLon = parseFloat(long);

    // GeoJSON format location object for the origin
    const origin = {
      type: "Point",
      coordinates: [originLon, originLat],
    };

    // Iterate over all distances and fetch drivers within each range
    for (let distance of distances) {
      const driversWithinDistance = await drivers
        .find({
          location: {
            $near: {
              $geometry: origin, // Origin point
              $maxDistance: distance, // Max distance in meters
            },
          },
        })
        .toArray();

      console.log(`Drivers within ${distance} meters:`);
      if (driversWithinDistance.length > 0) {
        driversWithinDistance.forEach((driver) => {
          console.log(
            `- ${driver.name}: (${driver.location.coordinates[1]}, ${driver.location.coordinates[0]})`
          );
        });
      } else {
        console.log("No drivers found within this range.");
      }
    }
  } catch (err) {
    console.error("Error fetching drivers:", err);
  }
};
