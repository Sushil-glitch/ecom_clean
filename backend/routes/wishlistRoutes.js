const express = require("express");

const router = express.Router();

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const {
  authMiddleware,
} = require("../middleware/authMiddleware");

// Get wishlist
router.get(
  "/",
  authMiddleware,
  getWishlist
);

// Add product
router.post(
  "/add",
  authMiddleware,
  addToWishlist
);

// Remove product
router.delete(
  "/:productId",
  authMiddleware,
  removeFromWishlist
);

module.exports = router;