const Plant = require("../models/plantModel");
const DeviceCommandLog = require("../models/commandLogModel");
const mqtt = require("mqtt");

// Connect to internal broker
const mqttClient = mqtt.connect("mqtt://localhost:1883");

const runAutomation = async (device, telemetryData) => {
  if (!device.automationEnabled || !device.selectedPlant) return;

  try {
    const plant = await Plant.findById(device.selectedPlant);
    if (!plant) return;

    const { ph, tds } = telemetryData;
    const { targetPh, targetTds } = plant;
    const marginPh = 0.2;
    const marginTds = 50;

    // pH Automation (Assuming pH-Down pump on MOTOR_IN_PIN/26)
    if (ph > targetPh + marginPh) {
      await sendAutomationCommand(
        device,
        "MOTOR_IN_ON",
        "pH too high, turning on pH-down pump",
      );
    } else if (ph < targetPh - marginPh) {
      await sendAutomationCommand(
        device,
        "MOTOR_IN_OFF",
        "pH balanced, turning off pH-down pump",
      );
    }

    // TDS Automation (Assuming Nutrient pump on MOTOR_OUT_PIN/27)
    if (tds < targetTds - marginTds) {
      await sendAutomationCommand(
        device,
        "MOTOR_OUT_ON",
        "TDS too low, turning on nutrient pump",
      );
    } else if (tds > targetTds + marginTds) {
      await sendAutomationCommand(
        device,
        "MOTOR_OUT_OFF",
        "TDS balanced, turning off nutrient pump",
      );
    }
  } catch (error) {
    console.error("Automation Error:", error);
  }
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

  mqttClient.publish(topic, message, { qos: 1 });
  console.log(`[Automation] Sent ${command} to ${device.deviceId}: ${reason}`);
};

module.exports = { runAutomation };
