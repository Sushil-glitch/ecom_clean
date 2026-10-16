// One-time script to create the admin account.
// Run with:  node seedAdmin.js
// (Uses the same MONGO_URI as the rest of the app, from .env)

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");

// ---- Admin credentials ----
// You can override any of these by setting env vars before running,
// e.g. ADMIN_EMAIL=me@company.com ADMIN_PASSWORD=something node seedAdmin.js
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@myapp.com";
const ADMIN_CONTACT = process.env.ADMIN_CONTACT || "9999999999";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce";
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existing) {
      console.log(`An account with email ${ADMIN_EMAIL} already exists.`);

      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log("Existing account upgraded to admin role.");
      } else {
        console.log("That account is already an admin. Nothing to do.");
      }

      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.create({
      name: ADMIN_NAME,
      contact: ADMIN_CONTACT,
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin account created successfully.");
    console.log("--------------------------------------");
    console.log("Email:   ", ADMIN_EMAIL);
    console.log("Password:", ADMIN_PASSWORD);
    console.log("--------------------------------------");
    console.log("Log in with these, then change the password from the app.");

    await mongoose.disconnect();

  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  }
};

run();
