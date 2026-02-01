const mongoose = require("mongoose");

const telemetrySchema = mongoose.Schema(
  {
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    data: {
      ph: Number,
      tds: Number,
      temperature: Number,
      humidity: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timeseries: {
      timeField: "timestamp",
      metaField: "device",
      granularity: "minutes",
    },
  },
);

module.exports = mongoose.model("DeviceTelemetry", telemetrySchema);
