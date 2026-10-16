const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {
  registerUser,
  registerAdmin,
  loginUser,
  forgotPassword,
  verifyOTP,
  resetPassword,
  requestChangePasswordOTP,
  changePassword,
} = require("../controllers/authController");

const {
  authMiddleware,
} = require("../middleware/authMiddleware");

// Rate limiters for auth & OTP endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login/auth requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// CLIENT REGISTER
// =====================================================

router.post("/register", authLimiter, registerUser);

// =====================================================
// ADMIN REGISTER
// =====================================================

router.post("/admin/register", registerAdmin);

// =====================================================
// LOGIN
// =====================================================

router.post("/login", authLimiter, loginUser);

// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post("/forgot-password", otpLimiter, forgotPassword);

// =====================================================
// VERIFY OTP
// =====================================================

router.post("/verify-otp", otpLimiter, verifyOTP);

// =====================================================
// RESET PASSWORD
// =====================================================

router.post("/reset-password", otpLimiter, resetPassword);

// =====================================================
// CHANGE PASSWORD & OTP REQUEST
// LOGGED-IN ADMIN / CLIENT
// =====================================================

router.post(
  "/change-password/request-otp",
  authMiddleware,
  otpLimiter,
  requestChangePasswordOTP
);

router.post(
  "/change-password",
  authMiddleware,
  otpLimiter,
  changePassword
);

router.put(
  "/change-password",
  authMiddleware,
  otpLimiter,
  changePassword
);

module.exports = router;