const Device = require("../models/deviceModel");
const Company = require("../models/companyModel");
const DeviceTelemetry = require("../models/telemetryModel");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// @desc    Register a new device
// @route   POST /api/devices
// @access  Private
const registerDevice = async (req, res) => {
  try {
    if (!req.user.company) {
      return res
        .status(400)
        .json({ message: "User is not associated with a company." });
    }

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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all devices for user's company
// @route   GET /api/devices
// @access  Private
const getMyDevices = async (req, res) => {
  try {
    const devices = await Device.find({ company: req.user.company });
    const offlineThreshold = 30000;

    const enrichedDevices = await Promise.all(
      devices.map(async (device) => {
        const isOnline = !!(
          device.lastSeen && Date.now() - device.lastSeen < offlineThreshold
        );
        const currentStatus = isOnline ? "online" : "offline";

        const latestTelemetry = await DeviceTelemetry.findOne({
          device: device._id,
        }).sort({ timestamp: -1 });

        return {
          ...device.toObject(),
          status: currentStatus,
          latestData: latestTelemetry ? latestTelemetry.data : null,
        };
      }),
    );

    res.json(enrichedDevices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Claim a device using Pairing Token
// @route   POST /api/devices/claim
// @access  User
const claimDevice = async (req, res) => {
  const { pairingToken, token, name } = req.body;
  const tokenToUse = pairingToken || token;

  if (!tokenToUse) {
    return res.status(400).json({ message: "Pairing token required" });
  }

  // Find device by token
  const device = await Device.findOne({ pairingToken: tokenToUse });

  if (!device) {
    return res.status(404).json({ message: "Invalid pairing token" });
  }

  // Check expiry
  if (device.tokenExpiresAt && device.tokenExpiresAt < Date.now()) {
    return res.status(400).json({ message: "Pairing token expired" });
  }

  // Check if already claimed
  if (device.paired || (device.userId && device.status !== "unclaimed")) {
    return res.status(400).json({ message: "Device already claimed" });
  }

  // Generate Request Secret (User becomes the secure channel)
  const secret = crypto.randomBytes(16).toString("hex");
  const salt = await bcrypt.genSalt(10);
  const hashedSecret = await bcrypt.hash(secret, salt);

  // Bind Device
  device.company = req.user.company;
  device.userId = req.user._id; // New requirement
  device.name = name || device.name;
  device.deviceSecret = hashedSecret;
  device.pairingToken = undefined; // Clear token
  device.tokenExpiresAt = undefined;
  device.paired = true; // New requirement
  device.status = "online"; // Set online initially as we just communicated
  device.lastSeen = Date.now();
  console.log(`CLAIMING DEVICE ${device.deviceId} - Setting status to ONLINE`);

  await device.save();

  // Add to Company list
  // Add to Company list if user belongs to one
  if (req.user.company) {
    const company = await Company.findById(req.user.company);
    if (company) {
      if (!company.devices.includes(device._id)) {
        company.devices.push(device._id);
        await company.save();
      }
    }
  }

  // Return the secret to the user
  res.json({
    success: true,
    deviceId: device.deviceId,
  });
};

// @desc    Delete a device
// @route   DELETE /api/devices/:id
// @access  Private
const deleteDevice = async (req, res) => {
  const device = await Device.findById(req.params.id);

  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  // Ensure user owns the device
  // If device.company is missing (null), we allow deletion if the user's company matches (or is also null/missing)
  const deviceCompanyId = device.company ? device.company.toString() : null;
  const userCompanyId = req.user.company ? req.user.company.toString() : null;

  if (deviceCompanyId !== userCompanyId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // Remove device reference from Company
  await Company.updateOne(
    { _id: req.user.company },
    { $pull: { devices: req.params.id } },
  );

  await device.deleteOne();

  res.json({ message: "Device removed" });
};

// @desc    Update Automation Settings
// @route   PUT /api/devices/:id/automation
// @access  Private
const updateAutomation = async (req, res) => {
  try {
    const { automationEnabled, selectedPlant } = req.body;
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    if (device.company?.toString() !== req.user.company?.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    device.automationEnabled =
      automationEnabled !== undefined
        ? automationEnabled
        : device.automationEnabled;
    device.selectedPlant = selectedPlant || device.selectedPlant;

    await device.save();
    res.json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerDevice,
  getMyDevices,
  claimDevice,
  deleteDevice,
  updateAutomation,
};
