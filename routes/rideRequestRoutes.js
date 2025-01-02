// routes/RideRequestRoutes.js
const express = require("express");
const router = express.Router();
const rideRequestController = require("../controllers/rideRequestController");

router.get("/rides", rideRequestController.loadRideRequest);

router.post("/book-ride", rideRequestController.createRideRequest);

router.post("/cancel-ride", rideRequestController.cancelRideRequest);

module.exports = router;
