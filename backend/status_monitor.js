const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/hydroponics";

async function monitor() {
  await mongoose.connect(MONGO_URI);
  const Device = mongoose.model(
    "Device",
    new mongoose.Schema({
      deviceId: String,
      status: String,
      lastSeen: Date,
    }),
  );

  console.log("Monitoring status for device 'ef0ef1...' for 30 seconds...");

  for (let i = 0; i < 6; i++) {
    const d = await Device.findOne({ deviceId: /ef0ef1/i });
    const now = new Date();
    const diff = d.lastSeen ? (now - d.lastSeen) / 1000 : "N/A";
    console.log(
      `[${now.toLocaleTimeString()}] Status: ${d.status}, LastSeen: ${d.lastSeen.toLocaleTimeString()}, Seconds since last update: ${diff}`,
    );
    await new Promise((r) => setTimeout(r, 5000));
  }
  process.exit(0);
}

monitor();
