const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

try {
  const currentServers = dns.getServers();
  if (!currentServers || currentServers.length === 0 || currentServers.includes("127.0.0.1")) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
} catch (dnsErr) {
  console.warn("Could not set custom DNS fallback:", dnsErr.message);
}

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
