const express = require("express");
const router = express.Router();
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");

// Public Client Endpoint to Validate Promo Code
router.post("/validate", validateCoupon);

// Admin Endpoints
router.get("/admin/all", authMiddleware, adminOnly, getAllCoupons);
router.post("/admin", authMiddleware, adminOnly, createCoupon);
router.put("/admin/:id", authMiddleware, adminOnly, updateCoupon);
router.delete("/admin/:id", authMiddleware, adminOnly, deleteCoupon);

module.exports = router;
