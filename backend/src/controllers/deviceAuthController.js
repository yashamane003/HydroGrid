const Device = require("../models/deviceModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateDeviceToken = (id) => {
  return jwt.sign({ id, type: "device" }, process.env.JWT_SECRET, {
    expiresIn: "365d", // Devices tokens last longer
  });
};

// @desc    Auth device & get token
// @route   POST /api/devices/auth
// @access  Public
const authDevice = async (req, res) => {
  const { deviceId, deviceSecret } = req.body;

  const device = await Device.findOne({ deviceId });

  // Compare secret (assuming we hash it like passwords, which we should)
  // For Phase 0, we will assume plain text match or bcrypt match if we implemented hashing.
  // Let's implement hashing check.

  if (device && (await bcrypt.compare(deviceSecret, device.deviceSecret))) {
    // Update last seen
    device.lastSeen = Date.now();
    device.status = "online";
    await device.save();

    res.json({
      _id: device._id,
      deviceId: device.deviceId,
      name: device.name,
      token: generateDeviceToken(device._id),
    });
  } else {
    res.status(401).json({ message: "Invalid device credentials" });
  }
};

// @desc    Device Heartbeat
// @route   POST /api/devices/heartbeat
// @access  Device
const heartbeat = async (req, res) => {
  const device = await Device.findById(req.device._id);

  if (device) {
    device.lastSeen = Date.now();
    device.status = "online";
    await device.save();
    res.json({ message: "Heartbeat received" });
  } else {
    res.status(404).json({ message: "Device not found" });
  }
};

module.exports = { authDevice, heartbeat };
