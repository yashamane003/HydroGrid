const mongoose = require("mongoose");

const deviceSchema = mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    deviceSecret: {
      type: String,
      // required: true // Not required until claimed/auth setup
    },
    name: {
      type: String,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      // required: true // Not required for unclaimed devices
    },
    lastSeen: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["online", "offline", "unclaimed"],
      default: "unclaimed",
    },
    pairingToken: {
      type: String,
    },
    pairingExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Device", deviceSchema);
