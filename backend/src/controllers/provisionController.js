const Device = require("../models/deviceModel");
const crypto = require("crypto");

// @desc    Provision a device (Generate Pairing Token)
// @route   POST /api/devices/provision
// @access  Public (Device only)
const provisionDevice = async (req, res) => {
  const { deviceId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ message: "Device ID required" });
  }

  // Find or Create Device
  let device = await Device.findOne({ deviceId });

  if (!device) {
    device = await Device.create({
      deviceId,
      status: "unclaimed",
      name: `New Device ${deviceId.substr(-4)}`,
    });
  }

  // Generate 6-digit numeric token
  const token = crypto.randomInt(100000, 999999).toString();

  // Set expiry (e.g., 10 minutes)
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);

  device.pairingToken = token;
  device.pairingExpiry = expiry;

  // If device was already claimed, this puts it back into "pairing mode"
  // (Project decision: Does provisioning reset ownership?
  // Safe Safe Build Order says "Device can exist without user".
  // For now, allow re-pairing.)

  await device.save();

  res.json({
    pairingToken: token,
    expiresIn: 600, // seconds
  });
};

module.exports = { provisionDevice };
