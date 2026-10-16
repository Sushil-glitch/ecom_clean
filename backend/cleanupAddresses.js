const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const User = require("./models/User");

async function cleanupAddresses() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mern-auth-app";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for address cleanup...");

    const users = await User.find({ "addresses.0": { $exists: true } });
    let updatedCount = 0;

    for (const user of users) {
      if (!user.addresses || user.addresses.length === 0) continue;

      let modified = false;
      let foundDefault = false;
      let homeCount = 0;

      user.addresses.forEach((addr) => {
        // Enforce single default address
        if (addr.isDefault) {
          if (!foundDefault) {
            foundDefault = true;
          } else {
            addr.isDefault = false;
            modified = true;
          }
        }

        // Rename duplicate 'Home' addresses to 'Work' (Office)
        if (addr.label === "Home") {
          homeCount++;
          if (homeCount > 1) {
            addr.label = "Work";
            modified = true;
          }
        }
      });

      // Ensure at least 1 address is default if list is non-empty
      if (!foundDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
        modified = true;
      }

      if (modified) {
        await user.save();
        updatedCount++;
        console.log(`Cleaned up addresses for user: ${user.name} (${user.email})`);
      }
    }

    console.log(`Address cleanup completed! Updated ${updatedCount} user profiles.`);
    process.exit(0);
  } catch (error) {
    console.error("Address cleanup error:", error);
    process.exit(1);
  }
}

cleanupAddresses();
