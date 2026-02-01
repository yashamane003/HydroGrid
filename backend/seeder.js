const mongoose = require("mongoose");
const dotenv = require("dotenv");
const users = require("./data/users");
const User = require("./src/models/userModel");
const Company = require("./src/models/companyModel");
const connectDB = require("./src/config/db");

dotenv.config();

const importData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Company.deleteMany();

    const company = await Company.create({ name: "Default Hydro Farm" });

    for (const user of users) {
      user.company = company._id;
      await User.create(user);
    }

    console.log("Data Imported!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Company.deleteMany();

    console.log("Data Destroyed!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
