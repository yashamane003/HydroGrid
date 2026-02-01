const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/userModel");
const Company = require("./models/companyModel");
const connectDB = require("./config/db");

dotenv.config();

const cleanupFakeUsers = async () => {
  try {
    await connectDB();
    console.log("Cleaning up fake users...");

    const deletedUsers = await User.deleteMany({ email: { $regex: /^fake/ } });
    console.log(`Deleted ${deletedUsers.deletedCount} fake users.`);

    const deletedCompanies = await Company.deleteMany({
      name: { $regex: /^Fake Farm/ },
    });
    console.log(`Deleted ${deletedCompanies.deletedCount} fake companies.`);

    process.exit();
  } catch (error) {
    console.error("Error cleaning up:", error);
    process.exit(1);
  }
};

cleanupFakeUsers();
