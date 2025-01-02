const mongoose = require("mongoose");

const driverLocationSchema = new mongoose.Schema({
  driverId: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  loginTime: { type: Date, required: true, default: Date.now },
  logoutTime: { type: Date },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "inactive", "idle", "assigned"], default: "idle" },
});

driverLocationSchema.index({ location: "2dsphere" });

driverLocationSchema.statics.findById = function (id) {
  return this.findOne({ _id: new mongoose.Types.ObjectId(id) });
};

driverLocationSchema.statics.findByDriverId = function(driverId) {
  try {
    console.log('Dri ID', driverId);
    if (!driverId || typeof driverId !== "string") {
      throw new Error("Invalid driverId format");
      
    }
    return this.findOne({ driverId: driverId });
  }catch (err) {
    console.error('Error finding driver status:', err);
    throw err; // You can throw or handle the error here
  }
};

driverLocationSchema.statics.findByDriverIdAndUpdate = function(driverId, updateData) {
  return this.findOneAndUpdate(
    { driverId: driverId },        // Find the document with the specific driverId
    { $set: updateData, $currentDate: { updatedAt: true } }, // Set the update data and update the updatedAt timestamp
    { new: true }                  // Return the modified document rather than the original
  );
};

module.exports = mongoose.model("DriverLocationStatus", driverLocationSchema);
