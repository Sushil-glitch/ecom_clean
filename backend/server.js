const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");

// Load .env relative to this file
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

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const productRoutes = require("./routes/productRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const orderRoutes = require("./routes/orderRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const systemRoutes = require("./routes/systemRoutes");
const couponRoutes = require("./routes/couponRoutes");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, serverless) or matching localhost/vercel
      if (!origin || origin.includes("localhost") || origin.includes("vercel.app") || origin === process.env.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all production origins
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// =====================================================
// ROUTES
// =====================================================

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/coupons", couponRoutes);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ElectroZone MERN API is running live!",
  });
});

// =====================================================
// DATABASE & SERVER START
// =====================================================

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error("MongoDB connection error: MONGO_URI is not defined in your .env file.");
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB successfully connected");
      if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
        app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
        });
      }
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error.message || error);
    });
}

module.exports = app;