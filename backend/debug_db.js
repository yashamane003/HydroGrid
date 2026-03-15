const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./src/models/userModel");
const Plant = require("./src/models/plantModel");
const Company = require("./src/models/companyModel");
const Device = require("./src/models/deviceModel");

dotenv.config();

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const users = await User.find({});
    console.log("\n--- USERS ---");
    console.log(JSON.stringify(users, null, 2));

    const plants = await Plant.find({});
    console.log("\n--- PLANTS ---");
    console.log(JSON.stringify(plants, null, 2));

    const companies = await Company.find({});
    console.log("\n--- COMPANIES ---");
    console.log(JSON.stringify(companies, null, 2));

    const devices = await Device.find({});
    console.log("\n--- DEVICES ---");
    console.log(JSON.stringify(devices, null, 2));

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

debug();
