const mongoose = require("mongoose");
const path = require("path");
const dns = require("dns");
const bcrypt = require("bcryptjs");

// Load .env relative to this backend directory
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Ensure Node's c-ares DNS resolver can resolve MongoDB Atlas SRV records on Windows
try {
  const currentServers = dns.getServers();
  if (!currentServers || currentServers.length === 0 || currentServers.includes("127.0.0.1")) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
} catch (dnsErr) {
  console.warn("Could not set custom DNS fallback:", dnsErr.message);
}

const User = require("./models/User");

// Sample test users for different roles
const testUsers = [
  {
    name: "ElectroZone Shopper",
    email: "client.test@electrozone.com",
    contact: "9876543210",
    rawPassword: "Client@12345",
    role: "client",
    isActive: true,
    addresses: [
      {
        label: "Home",
        fullName: "ElectroZone Shopper",
        phone: "9876543210",
        addressLine: "Flat 402, Skyline Towers, Tech Hub Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        landmark: "Near Central Mall",
        isDefault: true,
      },
    ],
  },
  {
    name: "Speedy Delivery Agent",
    email: "driver.test@electrozone.com",
    contact: "9876543211",
    rawPassword: "Driver@12345",
    role: "delivery",
    isActive: true,
    availabilityStatus: "available",
    maxActiveOrders: 3,
    isAutoAssignmentEnabled: true,
    vehicleDetails: {
      vehicleType: "Motorcycle",
      vehicleModel: "Honda Activa 6G",
      bikeNumber: "KA-01-EZ-1234",
      licenseNumber: "DL-2024-987654",
    },
    deliveryStats: {
      averageRating: 4.9,
      totalRatingsCount: 15,
      fiveStarCount: 14,
    },
  },
];

async function seedTestUsers() {
  if (!process.env.MONGO_URI) {
    console.error("ERROR: MONGO_URI is missing from your .env file!");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    const dbName = mongoose.connection.name;
    console.log(`Connected successfully to database: "${dbName}"`);
    console.log(`Target Collection: "users"`);
    console.log(`Mode: SAFE ADDITIVE (Non-destructive - existing users preserved)\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const u of testUsers) {
      const normalizedEmail = u.email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail });

      if (existing) {
        console.log(`- [SKIP] User already exists: "${normalizedEmail}" [Role: ${existing.role}]`);
        skippedCount++;
      } else {
        const hashedPassword = await bcrypt.hash(u.rawPassword, 10);
        const { rawPassword, ...userData } = u;

        await User.create({
          ...userData,
          email: normalizedEmail,
          password: hashedPassword,
        });

        console.log(`+ [ADDED] Created test user: "${normalizedEmail}" [Role: ${u.role}]`);
        addedCount++;
      }
    }

    const totalUsers = await User.countDocuments();
    console.log("\n=================================================");
    console.log(`USER SEEDING COMPLETED SUMMARY:`);
    console.log(`- New test users inserted : ${addedCount}`);
    console.log(`- Existing users skipped  : ${skippedCount}`);
    console.log(`- Total users in DB       : ${totalUsers}`);
    console.log("=================================================");

    await mongoose.connection.close();
    console.log("Database connection closed cleanly.");
    process.exit(0);
  } catch (err) {
    console.error("User seeding error:", err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Execute when run directly
if (require.main === module) {
  seedTestUsers();
}

module.exports = { seedTestUsers, testUsers };
