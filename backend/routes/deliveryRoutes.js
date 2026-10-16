const express = require("express");
const {
  authMiddleware,
} = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getDeliveryOrders,
  getDeliveryOrderById,
  getDeliveryStats,
  acceptOrder,
  rejectOrder,
  pickupOrder,
  outForDeliveryOrder,
  deliverOrder,
  resendDeliveryOtp,
} = require("../controllers/deliveryController");

const {
  getWalletDetails,
  updateUpiId,
  requestWithdrawal,
  depositCash,
} = require("../controllers/deliveryWalletController");

const router = express.Router();

// Apply auth and delivery role requirement to all delivery routes
router.use(authMiddleware);
router.use(roleMiddleware("delivery"));

// Delivery stats
router.get("/stats", getDeliveryStats);

// Wallet & UPI Payouts
router.get("/wallet", getWalletDetails);
router.put("/wallet/upi", updateUpiId);
router.post("/wallet/withdraw", requestWithdrawal);
router.post("/wallet/deposit", depositCash);

// Delivery orders list
router.get("/orders", getDeliveryOrders);

// Single order details
router.get("/orders/:id", getDeliveryOrderById);

// State transition routes
router.put("/orders/:id/accept", acceptOrder);
router.put("/orders/:id/reject", rejectOrder);
router.put("/orders/:id/pickup", pickupOrder);
router.put("/orders/:id/out-for-delivery", outForDeliveryOrder);
router.put("/orders/:id/delivered", deliverOrder);
router.post("/orders/:id/resend-otp", resendDeliveryOtp);

module.exports = router;
