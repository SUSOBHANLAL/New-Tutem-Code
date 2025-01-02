const mongoose = require("mongoose");

// Define the BitsFifo schema
const FifoStationsDataSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: true,
      unique: true, // Ensure driverId is unique
    },
    location: {
      type: {
        type: String, // "Point"
        enum: ["Point"], // Only "Point" for geo data
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    stationName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["idle", "active", "busy"], // Add any relevant status
      default: "idle",
    }
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// Create a geospatial index on the coordinates field for efficient querying
FifoStationsDataSchema.index({ location: "2dsphere" });

const FifoStationsData = mongoose.model("FifoStationsData", FifoStationsDataSchema);

module.exports = FifoStationsData;
