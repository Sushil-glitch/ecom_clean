const express = require("express");
const router = express.Router();
const {
  getMaintenanceStatus,
  updateMaintenanceStatus,
  testSmtpConnection,
  getHeroBanners,
  updateHeroBanners,
} = require("../controllers/systemController");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Public route to check maintenance mode status
router.get("/maintenance", getMaintenanceStatus);

// Public route to fetch active hero banners
router.get("/hero-banners", getHeroBanners);

// Protected admin-only route to update hero banners
router.put("/hero-banners", authMiddleware, adminOnly, updateHeroBanners);

// Protected admin-only route to toggle maintenance mode & SMTP settings
router.put("/maintenance", authMiddleware, adminOnly, updateMaintenanceStatus);

// Protected admin-only route to test SMTP mail configuration
router.post("/smtp/test", authMiddleware, adminOnly, testSmtpConnection);

module.exports = router;
