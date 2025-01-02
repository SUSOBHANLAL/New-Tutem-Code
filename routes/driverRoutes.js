// routes/driverRoutes.js
const express = require("express");
const {
  addDriver,
  getNearestFIFOStation
} = require("../controllers/driverController");

const router = express.Router();

// Routes
router.post("/add", addDriver);

// POST route to find the nearest station drivers or normal nearest drivers
router.post("/find-driver", getNearestFIFOStation);

module.exports = router;
