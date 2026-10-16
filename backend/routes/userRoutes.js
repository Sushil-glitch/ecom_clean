const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLER
// =====================================================

const userController = require("../controllers/userController");

// =====================================================
// MIDDLEWARE
// =====================================================

const {
  authMiddleware,
  adminOnly,
} = require("../middleware/authMiddleware");

// =====================================================
// PROFILE
// =====================================================

// GET /api/user/profile
router.get(
  "/profile",
  authMiddleware,
  userController.getProfile
);

// GET /api/user/profile/:id
router.get(
  "/profile/:id",
  authMiddleware,
  userController.getProfile
);

// PUT /api/user/profile
router.put(
  "/profile",
  authMiddleware,
  userController.updateProfile
);

// PUT /api/user/profile/:id
router.put(
  "/profile/:id",
  authMiddleware,
  userController.updateProfile
);

// PATCH /api/user/profile
router.patch(
  "/profile",
  authMiddleware,
  userController.updateProfile
);

// =====================================================
// SAVED ADDRESSES
// =====================================================

// GET /api/user/addresses
router.get(
  "/addresses",
  authMiddleware,
  userController.getAddresses
);

// POST /api/user/addresses
router.post(
  "/addresses",
  authMiddleware,
  userController.addAddress
);

// PUT /api/user/addresses/:addressId
router.put(
  "/addresses/:addressId",
  authMiddleware,
  userController.updateAddress
);

// DELETE /api/user/addresses/:addressId
router.delete(
  "/addresses/:addressId",
  authMiddleware,
  userController.deleteAddress
);

// PUT /api/user/addresses/:addressId/default
router.put(
  "/addresses/:addressId/default",
  authMiddleware,
  userController.setDefaultAddress
);

// =====================================================
// ADMIN DASHBOARD
// =====================================================

// GET /api/user/dashboard-stats
router.get(
  "/dashboard-stats",
  authMiddleware,
  adminOnly,
  userController.getDashboardStats
);

// =====================================================
// ADMIN - USERS
// =====================================================

// GET /api/user/users
router.get(
  "/users",
  authMiddleware,
  adminOnly,
  userController.getAllUsers
);

// GET /api/user/users/:id
router.get(
  "/users/:id",
  authMiddleware,
  adminOnly,
  userController.getUserById
);

// PUT /api/user/users/:id
router.put(
  "/users/:id",
  authMiddleware,
  adminOnly,
  userController.updateUser
);

// PATCH /api/user/users/:id
router.patch(
  "/users/:id",
  authMiddleware,
  adminOnly,
  userController.updateUser
);

// =====================================================
// USER STATUS
// =====================================================

// PATCH /api/user/toggle-status/:id
router.patch(
  "/toggle-status/:id",
  authMiddleware,
  adminOnly,
  userController.toggleUserStatus
);

// =====================================================
// SOFT DELETE
// =====================================================

// DELETE /api/user/me (Self-Delete for client/driver)
router.delete(
  "/me",
  authMiddleware,
  userController.deleteOwnAccount
);

// PATCH /api/user/soft-delete/:id (Admin Soft Delete)
router.patch(
  "/soft-delete/:id",
  authMiddleware,
  adminOnly,
  userController.softDeleteUser
);

// =====================================================
// BIN
// =====================================================

// GET /api/user/bin
router.get(
  "/bin",
  authMiddleware,
  adminOnly,
  userController.getBinUsers
);

// PATCH /api/user/restore/:id
router.patch(
  "/restore/:id",
  authMiddleware,
  adminOnly,
  userController.restoreUser
);

// DELETE /api/user/hard-delete/:id
router.delete(
  "/hard-delete/:id",
  authMiddleware,
  adminOnly,
  userController.hardDeleteUser
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;