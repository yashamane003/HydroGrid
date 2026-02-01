const Device = require("../models/deviceModel");
const Company = require("../models/companyModel");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// @desc    Register a new device
// @route   POST /api/devices
// @access  Private
const registerDevice = async (req, res) => {
  const { name, deviceId } = req.body;

  const deviceExists = await Device.findOne({ deviceId });

  if (deviceExists) {
    return res.status(400).json({ message: "Device ID already exists" });
  }

  // Generate a random secret
  const secret = crypto.randomBytes(16).toString("hex");

  // Hash the secret
  const salt = await bcrypt.genSalt(10);
  const hashedSecret = await bcrypt.hash(secret, salt);

  const device = await Device.create({
    name,
    deviceId,
    deviceSecret: hashedSecret,
    company: req.user.company,
    status: "offline",
  });

  if (device) {
    res.status(201).json({
      _id: device._id,
      name: device.name,
      deviceId: device.deviceId,
      secret: secret, // Send only once!
    });
  } else {
    res.status(400).json({ message: "Invalid device data" });
  }
};

// @desc    Get all devices for user's company
// @route   GET /api/devices
// @access  Private
const getMyDevices = async (req, res) => {
  const devices = await Device.find({ company: req.user.company });
  res.json(devices);
};

// @desc    Claim a device using Pairing Token
// @route   POST /api/devices/claim
// @access  User
const claimDevice = async (req, res) => {
  const { pairingToken, name } = req.body;

  if (!pairingToken) {
    return res.status(400).json({ message: "Pairing token required" });
  }

  // Find device by token
  const device = await Device.findOne({ pairingToken });

  if (!device) {
    return res.status(404).json({ message: "Invalid pairing token" });
  }

  // Check expiry
  if (device.pairingExpiry && device.pairingExpiry < Date.now()) {
    return res.status(400).json({ message: "Pairing token expired" });
  }

  // Check if already claimed (redundant if token is cleared, but safe)
  if (device.status !== "unclaimed" && device.company) {
    return res.status(400).json({ message: "Device already claimed" });
  }

  // Generate Request Secret (User becomes the secure channel)
  const secret = crypto.randomBytes(16).toString("hex");
  const salt = await bcrypt.genSalt(10);
  const hashedSecret = await bcrypt.hash(secret, salt);

  // Bind Device
  device.company = req.user.company;
  device.name = name || device.name;
  device.deviceSecret = hashedSecret;
  device.pairingToken = undefined; // Clear token
  device.pairingExpiry = undefined;
  device.status = "offline"; // Ready for auth

  await device.save();

  // Add to Company list
  const company = await Company.findById(req.user.company);
  if (!company.devices.includes(device._id)) {
    company.devices.push(device._id);
    await company.save();
  }

  // Return the secret to the user
  res.json({
    _id: device._id,
    deviceId: device.deviceId,
    name: device.name,
    deviceSecret: secret, // One-time show
  });
};

module.exports = { registerDevice, getMyDevices, claimDevice };
