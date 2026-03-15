const Device = require("../models/deviceModel");
const crypto = require("crypto");
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
      company: device.company, // Required for MQTT Topic
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

// @desc    Initialize pairing (ESP32 calls this)
// @route   POST /api/devices/pair/init
// @access  Public
// @desc    Initialize pairing (ESP32 calls this)
// @route   POST /api/devices/pair/init
// @access  Public
const initPairing = async (req, res) => {
  const { mac, token } = req.body; // Logic says token comes from device, but we might ignore it if reusing

  if (!mac) {
    return res.status(400).json({ message: "MAC required" });
  }

  // Generate deterministic Device ID from MAC
  const hmac = crypto.createHmac(
    "sha256",
    process.env.JWT_SECRET || "users_secret",
  );
  hmac.update(mac);
  const deviceId = hmac.digest("hex");

  let device = await Device.findOne({ deviceId });

  if (!device) {
    // New device
    if (!token) {
      return res.status(400).json({ message: "Token required for new device" });
    }

    device = await Device.create({
      deviceId,
      rawMac: mac,
      name: "New Device",
      status: "unclaimed",
      pairingToken: token,
      tokenExpiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
    });
    return res.json({ message: "Pairing initiated", deviceId });
  }

  // Device exists
  if (device.paired) {
    return res.status(400).json({ message: "Device already paired" });
  }

  // Check if existing token is valid
  if (device.pairingToken && device.tokenExpiresAt > Date.now()) {
    // Reuse existing token
    return res.json({
      message: "Pairing already active",
      deviceId,
      token: device.pairingToken, // Return existing token
    });
  }

  // Token expired or missing, regenerate
  // Note: The prompt implies the DEVICE generates the token.
  // If the device rebooted and generated a NEW token, but the backend has an EXPIRED token,
  // we should update it.
  // If the prompt says "Only generate/store a new token if device is unclaimed", it usually refers to the Backend's view.
  // The ESP32 logic: "If state === 'UNCLAIMED' → Generate new 6-digit token → Call /api/esp/pair/init"
  // So if backend says UNCLAIMED (expired), ESP32 sends a NEW token. We should save it.

  if (!token) {
    return res
      .status(400)
      .json({ message: "Token required to restart pairing" });
  }

  device.pairingToken = token;
  device.tokenExpiresAt = Date.now() + 10 * 60 * 1000;
  device.lastSeen = Date.now();
  await device.save();

  res.json({ message: "Pairing initiated", deviceId });
};

// @desc    Check pairing status (Polling by Device)
// @route   GET /api/devices/status
// @access  Public
// @desc    Check pairing status (Polling by Device)
// @route   GET /api/devices/status
// @access  Public
// @desc    Check pairing status (Polling by Device)
// @route   GET /api/devices/status
// @access  Public
const getDeviceStatus = async (req, res) => {
  const { mac } = req.query;

  if (!mac) {
    return res.status(400).json({ message: "MAC address required" });
  }

  // Derive deviceId from MAC
  const hmac = crypto.createHmac(
    "sha256",
    process.env.JWT_SECRET || "users_secret",
  );
  hmac.update(mac);
  const deviceId = hmac.digest("hex");

  console.log(`[StatusCheck] MAC: ${mac} -> Derived ID: ${deviceId}`);

  const device = await Device.findOne({ deviceId });

  if (!device) {
    return res.json({ state: "UNCLAIMED" });
  }

  if (device.paired) {
    device.lastSeen = Date.now();
    device.status = "online";
    await device.save();
    return res.json({
      state: "PAIRED",
      deviceId: device.deviceId,
      company: device.company, // Required for MQTT
    });
  }

  // Unpaired but exists -> Check if valid token exists
  if (device.pairingToken && device.tokenExpiresAt > Date.now()) {
    return res.json({
      state: "PAIRING",
      token: device.pairingToken,
    });
  }

  // Exists but no valid token
  return res.json({ state: "UNCLAIMED" });
};

module.exports = { authDevice, heartbeat, initPairing, getDeviceStatus };
