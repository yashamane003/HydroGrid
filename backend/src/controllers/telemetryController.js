const DeviceTelemetry = require("../models/telemetryModel");
const Device = require("../models/deviceModel");

// @desc    Ingest Telemetry Data
// @route   POST /api/devices/:id/telemetry
// @access  Device
const ingestTelemetry = async (req, res) => {
  // req.device is populated by verifyDevice middleware
  // Check if :id matches authenticated device
  if (
    req.params.id !== req.device.deviceId &&
    req.params.id !== req.device._id.toString()
  ) {
    return res.status(403).json({ message: "Device ID mismatch" });
  }

  const { ph, tds, temperature, humidity } = req.body;

  const telemetry = await DeviceTelemetry.create({
    device: req.device._id,
    company: req.device.company,
    data: { ph, tds, temperature, humidity },
  });

  if (telemetry) {
    // Also update the device's "last known state" (optional, for quick dashboard read)
    // For now, we rely on the telemetry table, but a "current state" cache on the Device model is common.
    req.device.lastSeen = Date.now();
    await req.device.save();

    res.status(201).json({ message: "Telemetry received" });
  } else {
    res.status(400).json({ message: "Invalid data" });
  }
};

// @desc    Get Latest Telemetry (for Dashboard Live View)
// @route   GET /api/devices/:id/telemetry
// @access  User
const getLatestTelemetry = async (req, res) => {
  // Check if device belongs to user's company (Assuming verifyToken middleware runs before)
  // We need to look up the device first
  const device = await Device.findOne({
    $or: [{ deviceId: req.params.id }, { _id: req.params.id }],
    company: req.user.company,
  });

  if (!device) {
    return res
      .status(404)
      .json({ message: "Device not found or not authorized" });
  }

  const latest = await DeviceTelemetry.findOne({ device: device._id }).sort({
    timestamp: -1,
  });

  res.json(latest || {});
};

// @desc    Get Historical Telemetry
// @route   GET /api/devices/:id/telemetry/history
// @access  User
const getHistory = async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;

  const device = await Device.findOne({
    $or: [{ deviceId: req.params.id }, { _id: req.params.id }],
    company: req.user.company,
  });

  if (!device) {
    return res
      .status(404)
      .json({ message: "Device not found or not authorized" });
  }

  // Get last N records, sorted ascending for charts
  const history = await DeviceTelemetry.find({ device: device._id })
    .sort({ timestamp: -1 })
    .limit(limit);

  // Reverse to chronological order for the chart
  res.json(history.reverse());
};

module.exports = { ingestTelemetry, getLatestTelemetry, getHistory };
