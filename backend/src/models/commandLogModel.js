const mongoose = require("mongoose");

const commandLogSchema = mongoose.Schema(
  {
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    command: {
      type: String,
      required: true,
    },
    payload: {
      type: Object,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "executed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("DeviceCommandLog", commandLogSchema);
