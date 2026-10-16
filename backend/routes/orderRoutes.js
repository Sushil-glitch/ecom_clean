const express = require("express");

const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  getOrderByOrderId,
  updateOrderStatus,
  cancelOrder,
  rateRider,
} = require("../controllers/orderControllers");

const {
  authMiddleware,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// CLIENT
// =====================================================

// Place a new order
router.post(
  "/",
  authMiddleware,
  createOrder
);

// Get logged-in client's orders
router.get(
  "/my-orders",
  authMiddleware,
  getMyOrders
);

// Cancel an order
router.put(
  "/:id/cancel",
  authMiddleware,
  cancelOrder
);

// Rate delivery partner for delivered order
router.post(
  "/:id/rate-rider",
  authMiddleware,
  rateRider
);

// =====================================================
// ADMIN
// =====================================================

// Get all orders
router.get(
  "/",
  authMiddleware,
  adminOnly,
  getAllOrders
);

// Update order status
router.put(
  "/:id/status",
  authMiddleware,
  adminOnly,
  updateOrderStatus
);

// =====================================================
// COMMON AUTHENTICATED USER
// =====================================================

// Get single order
router.get(
  "/:id",
  authMiddleware,
  getOrderById
);

// Get order using custom orderId
router.get(
  "/order-id/:orderId",
  authMiddleware,
  getOrderByOrderId
);

module.exports = router;