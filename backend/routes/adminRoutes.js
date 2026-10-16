const express = require("express");
const {
  authMiddleware,
  adminOnly,
} = require("../middleware/authMiddleware");

const {
  getDeliveryBoys,
  createDeliveryBoy,
  updateDeliveryBoy,
  assignDeliveryToOrder,
  unassignDeliveryFromOrder,
  autoAssignOrder,
  settleDriverCash,
  getCodDeposits,
  getDriverAppraisal,
} = require("../controllers/adminDeliveryController");

const {
  getPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
} = require("../controllers/deliveryWalletController");

const router = express.Router();

// Apply auth and admin check to all admin routes
router.use(authMiddleware);
router.use(adminOnly);

// Payout & COD Settlement Requests
router.get("/payouts", getPayoutRequests);
router.put("/payouts/:id/approve", approvePayoutRequest);
router.put("/payouts/:id/reject", rejectPayoutRequest);

// Delivery boy user management
router.get("/delivery-boys", getDeliveryBoys);
router.get("/delivery-boys/cod-deposits", getCodDeposits);
router.get("/delivery-boys/:id/appraisal", getDriverAppraisal);
router.post("/delivery-boys", createDeliveryBoy);
router.put("/delivery-boys/:id", updateDeliveryBoy);
router.put("/delivery-boys/:id/settle-cash", settleDriverCash);

// Order delivery assignment management
router.put("/orders/:id/assign-delivery", assignDeliveryToOrder);
router.put("/orders/:id/unassign-delivery", unassignDeliveryFromOrder);
router.put("/orders/:id/auto-assign", autoAssignOrder);

module.exports = router;

