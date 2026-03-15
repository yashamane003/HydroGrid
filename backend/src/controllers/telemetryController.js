const DeviceTelemetry = require("../models/telemetryModel");
const Device = require("../models/deviceModel");

// @desc    Ingest Telemetry Data
// @route   POST /api/devices/:id/telemetry
// @access  Device
const ingestTelemetry = async (req, res) => {
  try {
    // req.device is populated by verifyDevice middleware
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
      req.device.lastSeen = Date.now();
      req.device.status = "online";
      await req.device.save();

      // Trigger Automation
      const { runAutomation } = require("../services/automationService");
      runAutomation(req.device, { ph, tds, temperature, humidity });

      res.status(201).json({ message: "Telemetry received" });
    } else {
      res.status(400).json({ message: "Invalid data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Latest Telemetry (for Dashboard Live View)
// @route   GET /api/devices/:id/telemetry
// @access  User
const getLatestTelemetry = async (req, res) => {
  try {
    if (!req.user.company) {
      return res
        .status(400)
        .json({ message: "User is not associated with a company." });
    }

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

    const offlineThreshold = 30000;
    const isOnline = !!(
      device.lastSeen && Date.now() - device.lastSeen < offlineThreshold
    );

    res.json({
      ...(latest ? latest.toObject() : {}),
      status: isOnline ? "online" : "offline",
      isOnline,
      motorInStatus: device.motorInStatus,
      motorOutStatus: device.motorOutStatus,
      motorPhUpStatus: device.motorPhUpStatus,
      motorPhDownStatus: device.motorPhDownStatus,
      motorNutrientAStatus: device.motorNutrientAStatus,
      motorNutrientBStatus: device.motorNutrientBStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Historical Telemetry
// @route   GET /api/devices/:id/telemetry/history
// @access  User
const getHistory = async (req, res) => {
  try {
    if (!req.user.company) {
      return res
        .status(400)
        .json({ message: "User is not associated with a company." });
    }

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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { ingestTelemetry, getLatestTelemetry, getHistory };
