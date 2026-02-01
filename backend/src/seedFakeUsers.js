const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/userModel");
const Company = require("./models/companyModel");
const connectDB = require("./config/db");
const bcrypt = require("bcryptjs");

dotenv.config();

const seedFakeUsers = async () => {
  try {
    await connectDB();

    console.log("Seeding fake users for analytic graphs...");

    // Clear existing non-admin users if you want valid trend,
    // but for safety we will just ADD users.

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const days = 7;
    const usersPerDay = [2, 5, 3, 8, 4, 10, 6]; // "Increasing" trend roughly

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i)); // -6, -5, ... -0

      const count = usersPerDay[i];

      for (let j = 0; j < count; j++) {
        // Create company first to satisfy model
        const company = await Company.create({
          name: `Fake Farm ${i}-${j}`,
        });

        await User.create({
          name: `User ${i}-${j}`,
          email: `fake${i}${j}@example.com`,
          password: hashedPassword,
          role: "user",
          company: company._id,
          createdAt: date, // Override timestamp
          updatedAt: date,
        });
      }
      console.log(
        `Created ${count} users for ${date.toISOString().split("T")[0]}`,
      );
    }

    console.log("Seeding Complete. Usage data increased.");
    process.exit();
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
};

seedFakeUsers();
