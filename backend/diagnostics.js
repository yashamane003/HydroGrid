const mongoose = require("mongoose");
const aedes = require("aedes")();
const mqtt = require("mqtt");
require("dotenv").config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/hydroponics";

async function runDiagnostics() {
  try {
    console.log("--- DATABASE CHECK ---");
    await mongoose.connect(MONGO_URI);
    const Device = mongoose.model(
      "Device",
      new mongoose.Schema({
        deviceId: String,
        status: String,
        lastSeen: Date,
        company: mongoose.Schema.Types.ObjectId,
      }),
    );

    const devices = await Device.find({});
    console.log(`Found ${devices.length} devices.`);

    devices.forEach((d) => {
      console.log(`- ID: ${d._id}`);
      console.log(`  DeviceId: "${d.deviceId}" (len: ${d.deviceId.length})`);
      console.log(`  Status: ${d.status}`);
      console.log(`  LastSeen: ${d.lastSeen}`);
      console.log(`  Company: ${d.company}`);
    });

    console.log("\n--- MQTT SNIFFER (10s) ---");
    const client = mqtt.connect("mqtt://localhost:1883");
    client.on("connect", () => {
      console.log("Connected to local broker.");
      client.subscribe("#");
    });

    client.on("message", (topic, payload) => {
      console.log(`[MQTT] Topic: "${topic}" (len: ${topic.length})`);
      if (topic.includes("telemetry")) {
        console.log(`       Payload: ${payload.toString()}`);
        const parts = topic.split("/");
        console.log(`       Extracted DeviceId (parts[3]): "${parts[3]}"`);

        const match = devices.find((d) => d.deviceId === parts[3]);
        console.log(
          `       Match in DB? ${match ? "YES (" + match._id + ")" : "NO"}`,
        );
      }
    });

    setTimeout(() => {
      console.log("\nDiagnostics finished.");
      process.exit(0);
    }, 10000);
  } catch (err) {
    console.error("DIAGNOSTIC ERROR:", err);
    process.exit(1);
  }
}

runDiagnostics();
