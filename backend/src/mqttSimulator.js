const mqtt = require("mqtt");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Device = require("./models/deviceModel");

dotenv.config();

// Connect to local broker
const client = mqtt.connect("mqtt://localhost:1883");
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/hydroponics_db";

console.log("--- IoT Device Simulator Starting ---");
console.log(`Connecting to MQTT Broker...`);

let activeDevices = [];

// Connect to DB to get devices to simulate
mongoose.connect(MONGO_URI).then(async () => {
  console.log("Connected to MongoDB to fetch devices...");
  activeDevices = await Device.find({});
  console.log(`Found ${activeDevices.length} devices to simulate.`);

  // Subscribe to commands for all devices
  activeDevices.forEach((device) => {
    const topic = `company/${device.company}/device/${device.deviceId}/command`;
    client.subscribe(topic);
    console.log(`Subscribed to: ${topic}`);
  });
});

client.on("connect", () => {
  console.log("✅ Simulator Connected to MQTT Broker");

  // Start Heartbeat & Telemetry Loop
  setInterval(() => {
    simulateTelemetry();
  }, 5000); // Every 5 seconds
});

client.on("message", (topic, message) => {
  console.log(`\n📩 Received Command on ${topic}:`);
  const msg = JSON.parse(message.toString());
  console.log(`   Command: ${msg.command}`);
  console.log(`   Payload:`, msg.payload);

  // Simulate "Action"
  if (msg.command === "SET_PH") {
    console.log(`   ⚙️ Adjusting pH to ${msg.payload.target}...`);
  } else if (msg.command === "DOSE_NUTRIENTS") {
    console.log(`   ⚙️ Dosing Nutrients...`);
  } else if (msg.command.startsWith("MOTOR")) {
    console.log(`   ⚙️ Toggling Motor...`);
  }
});

const axios = require("axios");

async function simulateTelemetry() {
  console.log("\n--- Sending Telemetry Batch ---");
  for (const device of activeDevices) {
    // Generate random but realistic data
    const ph = (6.0 + Math.random()).toFixed(2); // 6.0 - 7.0
    const tds = Math.floor(400 + Math.random() * 100); // 400 - 500
    const temp = (22 + Math.random() * 2).toFixed(1); // 22 - 24
    const humidity = Math.floor(50 + Math.random() * 20); // 50 - 70

    try {
      // Need a valid device token?
      // Our ingestTelemetry endpoint is protected by `protectDevice`.
      // We need a device token.
      // For simulation, we can bypass or generate one?
      // Actually, we can just use the internal function or assume the simulator
      // has access if we relax middleware or log in.

      // SIMPLIFICATION: We will directly insert into MongoDB for simulation
      // to avoid needing to manage JWTs in this script.
      const DeviceTelemetry = require("./models/telemetryModel");

      await DeviceTelemetry.create({
        device: device._id,
        company: device.company,
        data: { ph, tds, temperature: temp, humidity },
        timestamp: Date.now(),
      });

      // Update Device Last Seen
      await Device.findByIdAndUpdate(device._id, {
        lastSeen: Date.now(),
        status: "online",
      });

      console.log(
        `✅ Data pushed for ${device.name || device.deviceId}: pH ${ph}`,
      );
    } catch (error) {
      console.error(
        `❌ Error pushing data for ${device.deviceId}:`,
        error.message,
      );
    }
  }
}
