const express = require("express");
const router = express.Router();
const {
  getPaymentSettings,
  updatePaymentSettings,
  createOrder,
  getClientOrders,
  getPaymentHistory,
  updatePaymentStatus,
  confirmOrderByOwner,
  cancelOrder,
  confirmOrderReceived,
  createRazorpayOrderHandler,
  verifyRazorpayPaymentHandler,
} = require("../controllers/paymentController");
const { authMiddleware, optionalAuthMiddleware, adminOnly } = require("../middleware/authMiddleware");
const { rateRider } = require("../controllers/orderControllers");

// Public / Client Settings & Checkout
router.get("/settings", getPaymentSettings);
router.post("/orders", optionalAuthMiddleware, createOrder);
router.get("/orders", optionalAuthMiddleware, getClientOrders);
router.patch("/confirm-received/:id", authMiddleware, confirmOrderReceived);
router.patch("/cancel/:id", authMiddleware, cancelOrder);
router.post("/orders/:id/rate-rider", authMiddleware, rateRider);

// Razorpay Dedicated Online Payment Endpoints
router.post("/razorpay/create-order", optionalAuthMiddleware, createRazorpayOrderHandler);
router.post("/razorpay/verify-payment", optionalAuthMiddleware, verifyRazorpayPaymentHandler);

// Admin Routes
router.put("/settings", authMiddleware, adminOnly, updatePaymentSettings);
router.get("/history", authMiddleware, adminOnly, getPaymentHistory);
router.patch("/status/:id", authMiddleware, adminOnly, updatePaymentStatus);
router.patch("/confirm-owner/:id", authMiddleware, adminOnly, confirmOrderByOwner);

module.exports = router;
