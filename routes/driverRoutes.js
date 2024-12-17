// routes/driverRoutes.js
const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driverController");
// const getNearestDrivers = require("../controllers/driverController");
// const validateDriverId = require('../middlewares/driver_middleware');

router.get("/location", driverController.getLocationPage);

//get the list of all available drivers nearest to given lat, long
router.get("/available-drivers", driverController.getNearestDrivers);

module.exports = router;
