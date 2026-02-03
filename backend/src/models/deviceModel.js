const mongoose = require("mongoose");

const deviceSchema = mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    rawMac: {
      type: String, // Stored for admin/debugging purposes
    },
    deviceSecret: {
      type: String,
      // required: true // Not required until claimed/auth setup
    },
    name: {
      type: String,
      default: "New Device", // Default name until claimed
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    paired: {
      type: Boolean,
      default: false,
    },
    pairingToken: {
      type: String, // 6-digit numeric token
    },
    tokenExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Device", deviceSchema);
