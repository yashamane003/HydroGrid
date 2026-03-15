const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const Device = require("./src/models/deviceModel");

const checkDevices = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/hydroponics",
    );
    const devices = await Device.find({});
    console.log("Devices found:", devices.length);
    devices.forEach((d) => {
      console.log(
        `- Name: ${d.name}, ID: ${d.deviceId}, MAC: ${d.rawMac}, Status: ${d.status}, LastSeen: ${d.lastSeen}, Paired: ${d.paired}`,
      );
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDevices();
