const Plant = require("../models/plantModel");
const DeviceCommandLog = require("../models/commandLogModel");
const mqtt = require("mqtt");

// Connect to internal broker
const mqttClient = mqtt.connect("mqtt://localhost:1883");

const runAutomation = async (device, telemetryData) => {
  // Continuous automation is DISABLED per the new One-Time Control Architecture.
  // The system only monitors by default. Dosing is triggered manually via START_CONTROL.
  return;
};

const sendAutomationCommand = async (device, command, reason) => {
  // Topic: company/{companyId}/device/{deviceId}/command
  const topic = `company/${device.company}/device/${device.deviceId}/command`;
  const message = JSON.stringify({
    command,
    payload: { source: "automation", reason },
    timestamp: Date.now(),
  });

  // Log the command
  await DeviceCommandLog.create({
    device: device._id,
    user: device.userId, // Use owner's ID
    command,
    payload: { source: "automation", reason },
    status: "sent",
  });

  // Update Device state based on command
  if (command === "MOTOR_IN_ON") device.motorInStatus = "ON";
  if (command === "MOTOR_IN_OFF") device.motorInStatus = "OFF";
  if (command === "MOTOR_OUT_ON") device.motorOutStatus = "ON";
  if (command === "MOTOR_OUT_OFF") device.motorOutStatus = "OFF";
  if (command === "MOTOR_PHUP_ON") device.motorPhUpStatus = "ON";
  if (command === "MOTOR_PHUP_OFF") device.motorPhUpStatus = "OFF";
  if (command === "MOTOR_PHDOWN_ON") device.motorPhDownStatus = "ON";
  if (command === "MOTOR_PHDOWN_OFF") device.motorPhDownStatus = "OFF";
  if (command === "MOTOR_NUTRIENTA_ON") device.motorNutrientAStatus = "ON";
  if (command === "MOTOR_NUTRIENTA_OFF") device.motorNutrientAStatus = "OFF";
  if (command === "MOTOR_NUTRIENTB_ON") device.motorNutrientBStatus = "ON";
  if (command === "MOTOR_NUTRIENTB_OFF") device.motorNutrientBStatus = "OFF";
  await device.save();

  mqttClient.publish(topic, message, { qos: 1 });
  console.log(`[Automation] Sent ${command} to ${device.deviceId}: ${reason}`);
};

module.exports = { runAutomation };
