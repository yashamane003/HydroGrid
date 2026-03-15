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

    // pH Automation
    if (ph > targetPh + marginPh) {
      await sendAutomationCommand(
        device,
        "MOTOR_PH_DOWN_ON",
        "pH too high (Basicity), turning on pH-Down (Acid) pump",
      );
    } else if (ph < targetPh - marginPh) {
      await sendAutomationCommand(
        device,
        "MOTOR_PH_UP_ON",
        "pH too low (Acidity), turning on pH-Up (Base) pump",
      );
    } else {
      // Balanced
      if (device.motorPhUpStatus === "ON")
        await sendAutomationCommand(
          device,
          "MOTOR_PH_UP_OFF",
          "pH balanced, turning off pH-Up pump",
        );
      if (device.motorPhDownStatus === "ON")
        await sendAutomationCommand(
          device,
          "MOTOR_PH_DOWN_OFF",
          "pH balanced, turning off pH-Down pump",
        );
    }

    // TDS Automation (Nutrients)
    if (tds < targetTds - marginTds) {
      await sendAutomationCommand(
        device,
        "MOTOR_NUTRIENT_A_ON",
        "TDS too low, turning on Nutrient A pump",
      );
      await sendAutomationCommand(
        device,
        "MOTOR_NUTRIENT_B_ON",
        "TDS too low, turning on Nutrient B pump",
      );
    } else if (tds >= targetTds) {
      // Turn off once we reach target (or within margin)
      if (device.motorNutrientAStatus === "ON")
        await sendAutomationCommand(
          device,
          "MOTOR_NUTRIENT_A_OFF",
          "TDS reached target, turning off nutrient pumps",
        );
      if (device.motorNutrientBStatus === "ON")
        await sendAutomationCommand(
          device,
          "MOTOR_NUTRIENT_B_OFF",
          "TDS reached target, turning off nutrient pumps",
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
