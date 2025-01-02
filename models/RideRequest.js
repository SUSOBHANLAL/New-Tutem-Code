// models/RideRequest.js
const mongoose = require("mongoose");
const database = require('../config/db');
const RideRequestSchema = new mongoose.Schema({
  driverId:    { type: String },
  userId:      { type: String },
  origin_name:  { type: String },
  origin_lat:   { type: String },
  origin_long:  { type: String },
  dest_name:    { type: String },
  dest_lat:     { type: String },
  dest_long:    { type: String },
  status:       { type: String, enum: ['pending', 'assigned', 'completed', 'cancelled'], default: 'assigned'},
});

// Add a static method to find by driver_id
RideRequestSchema.statics.findByDriverId = function (driver_id) {
  return this.findOne({ driver_id });
};

// Add a static method to find by request_id
RideRequestSchema.statics.findById = function (id) {
  return this.findOne({ _id: mongoose.Types.ObjectId(id) });
};

module.exports = mongoose.model("RideRequest", RideRequestSchema);
