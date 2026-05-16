const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
const Device = require("../models/deviceModel");
const DeviceTelemetry = require("../models/telemetryModel");
const fs = require("fs");
const path = require("path");
const port = 1883;

// Absolute path to log file in the backend root
const logPath = path.join(__dirname, "..", "..", "mqtt_activity.log");

// Shared publish handler
aedes.on("publish", async function (packet, client) {
  const topic = packet.topic;
  if (!topic || topic.startsWith("$SYS")) return;

  try {
    if (topic.includes("/telemetry")) {
      console.log(`[MQTT] Telemetry Topic Detected: ${topic}`);
      const rawPayload = packet.payload.toString();

      const parts = topic.split("/");
      const deviceId = parts[3];

      const device = await Device.findOne({
        $or: [
          { deviceId: deviceId },
          { deviceId: new RegExp(`^${deviceId}$`, "i") },
        ],
      });

      if (device) {
        let payload;
        try {
          const lastBrace = rawPayload.lastIndexOf("}");
          const cleanPayload =
            lastBrace !== -1
              ? rawPayload.substring(0, lastBrace + 1)
              : rawPayload;
          payload = JSON.parse(cleanPayload);
        } catch (e) {
          console.error(
            `[MQTT] JSON Parse Error for ${deviceId}: ${e.message}`,
          );
          console.error(`[MQTT] rawPayload: ${rawPayload}`);
          return;
        }

        await DeviceTelemetry.create({
          device: device._id,
          company: device.company,
          data: payload,
        });

        device.lastSeen = new Date();
        device.status = "online";
        if (payload.controlState !== undefined) device.controlState = payload.controlState;
        if (payload.waterLevelCm !== undefined) device.waterLevelCm = payload.waterLevelCm;
        await device.save();

        // Trigger Automation for MQTT Telemetry
        try {
          const { runAutomation } = require("./automationService");
          await runAutomation(device, payload);
        } catch (autoErr) {
          console.error(
            `[MQTT] Automation Error for ${deviceId}:`,
            autoErr.message,
          );
        }

        console.log(
          `[MQTT] SUCCESS: Device ${device.deviceId} is now ONLINE & Automation Triggered.`,
        );
      } else {
        console.warn(`[MQTT] FAILED: No device found for "${deviceId}"`);
      }
    }
  } catch (err) {
    console.error(`[MQTT] Fatal Error in Ingestion: ${err.message}`);
  }
});

aedes.on("client", function (client) {
  if (client) {
    console.log("MQTT Client Connected: " + client.id);
  }
});

const startBroker = () => {
  server.listen(port, "0.0.0.0", function () {
    console.log("MQTT Broker running on port " + port);
  });
  return aedes;
};

module.exports = startBroker;
