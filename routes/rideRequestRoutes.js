// routes/RideRequestRoutes.js
const express = require("express");
const router = express.Router();
const RideRequestController = require("../controllers/rideRequestController");

router.post("/add-rides", RideRequestController.createRideRequest);

module.exports = router;
