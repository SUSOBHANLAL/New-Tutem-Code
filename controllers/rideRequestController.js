// controllers/RideRequestController.js
const RideRequest = require("../models/RideRequest");
const User = require("../models/User");
const DriverStatus = require("../models/DriverLocationStatus");

exports.loadRideRequest = (req, res) => {
  console.log('in load RR controller');
  res.render('index');
};


// exports.getRideRequestByDriver = async (req, res) => {
//   try {
//     const driver_id = req.params.driver_id; // Extract the driver_id
//     const id = req.params.id;     // Extract the id
//     res.send(`Name: ${driver_id}, ID: ${id}`);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

///////////////////////////////////////////////////////////////

exports.createRideRequest = async (req, res) => {
  try {
    let returnData = [];
    const driverId = req.body.driverId;
// Check if rideId and driverId are not empty
    if (!driverId) {
      return res.status(400).json({ message: 'Both rideId and driverId are required' });
    }
    const driver = await DriverStatus.findByDriverId(driverId);
    const driverData = await User.findById(driverId);

    const updateriverStatus = await DriverStatus.findOneAndUpdate(
      { driverId: driverId},
      { status: "assigned" }, 
      { new: true, // Return the modified document
        runValidators: true, // Ensure validators run on the update
      });
    console.log('after findbyid');
    if (!driver) {
      return res.status(404).send({message:'Driver not found'});
    }

    if (driver.status !== 'idle') {
      return res.status(400).send({message:'Driver is not idle. Ride request cannot be made.'});
    }else{
      const rideData = await RideRequest.create(req.body);
      returnData.push({
        rideData,
        driverData
      }); 
     return res.status(201).json({message:'Ride booked successfully', returnData });
    }
  } catch (error) {
      return res.status(500).json({ error: error.message });
    }
};



exports.cancelRideRequest = async (req, res) => {
  try {
    console.log("Into cancel Ride request", req.body);
    console.log(req.body);
      const rideId = req.body._id;
      const driverId =  req.body.driverId;
    // Check if rideId and driverId are not empty
    if (!rideId || !driverId) {
      return res.status(400).json({ message: 'Both rideId and driverId are required' });
    }

      const updatedRideRequest = await RideRequest.findOneAndUpdate(
        { _id: rideId},
        { status: "cancelled" }, 
        { new: true, // Return the modified document
          runValidators: true, // Ensure validators run on the update
        });
        const updatedriverStatus = await DriverStatus.findOneAndUpdate(
        { driverId: driverId},
        { status: "idle" }, 
        { new: true, // Return the modified document
          runValidators: true, // Ensure validators run on the update
        });
      if (!updatedRideRequest) {
        return res
            .status(404)
            .json({ message: "RideRequest not found" });
      } else {
        return res
          .status(200)
          .json({ message: "RideRequest Cancelled", updatedRideRequest });
      }
  } catch (err) {
    console.error('Error cancelling RideRequest:', err);
  }
};

exports.getRideRequestByDriver = async (req, res) => {
  try {
    const driver_id = req.params.driver_id; // Extract the driver_id
    const id = req.params.id;     // Extract the id
    res.send(`Name: ${driver_id}, ID: ${id}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRideRequestById = async (req, res) => {
  const { id } = req.params;  // Extract the 'id' from the URL params

  try {
    // Find the ride request by the given ID (convert it to ObjectId if needed)
    const ride_req = await RideRequest.findById(id);

    if (!ride_req) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // If vehicle is found, send the data as JSON
    res.status(200).json(ride_req);

  } catch (err) {
    // Handle errors like invalid ID or database connection issues
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};


