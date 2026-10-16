const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getNotifications);
router.patch("/read-all", authMiddleware, markAllAsRead);
router.patch("/:id/read", authMiddleware, markAsRead);
router.delete("/clear", authMiddleware, clearNotifications);

module.exports = router;
