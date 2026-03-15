const Device = require("../models/deviceModel");
const DeviceCommandLog = require("../models/commandLogModel");
const mqtt = require("mqtt");

// Connect to internal broker (or external if configured)
const mqttClient = mqtt.connect("mqtt://localhost:1883");

mqttClient.on("connect", () => {
  console.log("Backend connected to MQTT Broker");
});

// @desc    Send Command to Device
// @route   POST /api/devices/:id/commands
// @access  User (Owner)
const sendCommand = async (req, res) => {
  const { command, payload } = req.body;
  const deviceId = req.params.id;

  // 1. Validate Ownership
  const device = await Device.findOne({
    $or: [{ deviceId: deviceId }, { _id: deviceId }],
    company: req.user.company,
  });

  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  // 2. Validate Command Structure (Basic safety)
  if (!command) {
    return res.status(400).json({ message: "Command is required" });
  }

  // 3. Log Intent (Pending)
  const log = await DeviceCommandLog.create({
    device: device._id,
    user: req.user._id,
    command,
    payload,
    status: "pending",
  });

  // 4. Publish to MQTT
  // Topic: company/{companyId}/device/{deviceId}/command
  const topic = `company/${req.user.company}/device/${device.deviceId}/command`;
  const message = JSON.stringify({
    cmdId: log._id,
    command,
    payload,
    timestamp: Date.now(),
  });

  mqttClient.publish(topic, message, { qos: 1 }, async (err) => {
    if (err) {
      console.error("MQTT Publish Error:", err);
      log.status = "failed";
      await log.save();
      return res.status(500).json({ message: "Failed to send command" });
    }

    // Optimistically update log to 'sent', device will confirm execution later
    log.status = "sent";
    await log.save();

    // Update Device state based on command
    if (command === "MOTOR_IN_ON") device.motorInStatus = "ON";
    if (command === "MOTOR_IN_OFF") device.motorInStatus = "OFF";
    if (command === "MOTOR_OUT_ON") device.motorOutStatus = "ON";
    if (command === "MOTOR_OUT_OFF") device.motorOutStatus = "OFF";
    if (command === "MOTOR_PH_UP_ON") device.motorPhUpStatus = "ON";
    if (command === "MOTOR_PH_UP_OFF") device.motorPhUpStatus = "OFF";
    if (command === "MOTOR_PH_DOWN_ON") device.motorPhDownStatus = "ON";
    if (command === "MOTOR_PH_DOWN_OFF") device.motorPhDownStatus = "OFF";
    if (command === "MOTOR_NUTRIENT_A_ON") device.motorNutrientAStatus = "ON";
    if (command === "MOTOR_NUTRIENT_A_OFF") device.motorNutrientAStatus = "OFF";
    if (command === "MOTOR_NUTRIENT_B_ON") device.motorNutrientBStatus = "ON";
    if (command === "MOTOR_NUTRIENT_B_OFF") device.motorNutrientBStatus = "OFF";
    await device.save();

    res.status(200).json({
      message: "Command sent",
      commandId: log._id,
      status: "sent",
      motorInStatus: device.motorInStatus,
      motorOutStatus: device.motorOutStatus,
      motorPhUpStatus: device.motorPhUpStatus,
      motorPhDownStatus: device.motorPhDownStatus,
      motorNutrientAStatus: device.motorNutrientAStatus,
      motorNutrientBStatus: device.motorNutrientBStatus,
    });
  });
};

// Specialized Motor Controls
const motorInOn = async (req, res) => {
  req.body.command = "MOTOR_IN_ON";
  return sendCommand(req, res);
};

const motorInOff = async (req, res) => {
  req.body.command = "MOTOR_IN_OFF";
  return sendCommand(req, res);
};

const motorOutOn = async (req, res) => {
  req.body.command = "MOTOR_OUT_ON";
  return sendCommand(req, res);
};

const motorOutOff = async (req, res) => {
  req.body.command = "MOTOR_OUT_OFF";
  return sendCommand(req, res);
};

const motorPhUpOn = async (req, res) => {
  req.body.command = "MOTOR_PH_UP_ON";
  return sendCommand(req, res);
};

const motorPhUpOff = async (req, res) => {
  req.body.command = "MOTOR_PH_UP_OFF";
  return sendCommand(req, res);
};

const motorPhDownOn = async (req, res) => {
  req.body.command = "MOTOR_PH_DOWN_ON";
  return sendCommand(req, res);
};

const motorPhDownOff = async (req, res) => {
  req.body.command = "MOTOR_PH_DOWN_OFF";
  return sendCommand(req, res);
};

const motorNutrientAOn = async (req, res) => {
  req.body.command = "MOTOR_NUTRIENT_A_ON";
  return sendCommand(req, res);
};

const motorNutrientAOff = async (req, res) => {
  req.body.command = "MOTOR_NUTRIENT_A_OFF";
  return sendCommand(req, res);
};

const motorNutrientBOn = async (req, res) => {
  req.body.command = "MOTOR_NUTRIENT_B_ON";
  return sendCommand(req, res);
};

const motorNutrientBOff = async (req, res) => {
  req.body.command = "MOTOR_NUTRIENT_B_OFF";
  return sendCommand(req, res);
};

module.exports = {
  sendCommand,
  motorInOn,
  motorInOff,
  motorOutOn,
  motorOutOff,
  motorPhUpOn,
  motorPhUpOff,
  motorPhDownOn,
  motorPhDownOff,
  motorNutrientAOn,
  motorNutrientAOff,
  motorNutrientBOn,
  motorNutrientBOff,
};
