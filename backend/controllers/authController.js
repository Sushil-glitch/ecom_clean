const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const generateOTP = require("../utils/generateOTP");
const sendMail = require("../utils/sendMail");

// =====================================================
// JWT
// =====================================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// =====================================================
// CLIENT REGISTER
// =====================================================

const registerUser = async (req, res) => {
  try {
    const { name, contact, email, password } = req.body;

    if (!name || !contact || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const cleanContact = contact.toString().trim();
    if (!/^\d{10}$/.test(cleanContact)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must contain only numbers and be exactly 10 digits (cannot exceed 10 digits)",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const assignedRole = "client";

    // Driver self-registrations require Admin confirmation before activation
    const initialIsActive = assignedRole === "delivery" ? false : true;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      contact: contact.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      isActive: initialIsActive,
    });

    // Notify Admin of new pending driver registration
    if (assignedRole === "delivery") {
      try {
        const Notification = require("../models/Notification");
        await Notification.create({
          recipientRole: "admin",
          title: `New Driver Registered: ${user.name}`,
          message: `New delivery driver ${user.name} (${user.email}) has registered and is pending your confirmation/activation.`,
          type: "system",
        });
      } catch (notifErr) {
        console.error("Pending driver notification error:", notifErr.message);
      }

      return res.status(201).json({
        success: true,
        requiresConfirmation: true,
        message: "Driver registration submitted successfully! Your account is pending Admin confirmation. You can log in once Admin approves your registration.",
        role: "delivery",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          contact: user.contact,
          role: user.role,
          isActive: false,
        },
      });
    }

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: `${assignedRole.charAt(0).toUpperCase() + assignedRole.slice(1)} registration successful`,
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("CLIENT REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// ADMIN REGISTER
// =====================================================

const registerAdmin = async (req, res) => {
  try {
    const { name, contact, email, password } = req.body;

    if (!name || !contact || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      contact: contact.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Admin registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("ADMIN REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.deletedAt) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DELETED",
        message: "This account has been deleted",
      });
    }

    if (
      (user.role === "client" || user.role === "delivery") &&
      user.isActive === false
    ) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_INACTIVE",
        message:
          user.role === "delivery"
            ? "Your driver registration is pending Admin confirmation. Please wait for Admin approval before logging in."
            : "Your account is currently inactive. Please contact the administrator.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!["admin", "client", "delivery"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Invalid account role",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// FORGOT PASSWORD
// =====================================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, an OTP has been sent.",
      });
    }

    if (user.deletedAt) {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted",
      });
    }

    const otp = String(generateOTP());

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    user.otpVerified = false;

    await user.save();

    console.log("=================================");
    console.log(`🔑 FORGOT PASSWORD OTP FOR ${user.email}: ${otp}`);
    console.log("=================================");

    try {
      await sendMail(
        user.email,
        "Password Reset OTP - Ecom Web",
        `Your Password Reset OTP is: ${otp}. This code is valid for 5 minutes.`
      );
    } catch (mailErr) {
      console.error("Mail delivery note (OTP saved in DB & console):", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "OTP generated and sent to your email address successfully.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during forgot password processing.",
    });
  }
};

// =====================================================
// VERIFY OTP
// =====================================================

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOTP = String(otp).trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or email address",
      });
    }

    if (!user.otp) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found",
      });
    }

    if (String(user.otp).trim() !== normalizedOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (
      !user.otpExpiry ||
      user.otpExpiry.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    user.otpVerified = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================

const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("=================================");
    console.log("RESET PASSWORD REQUEST");
    console.log("Email:", email);
    console.log("=================================");

    // =================================================
    // VALIDATION
    // =================================================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // =================================================
    // FIND USER
    // =================================================

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =================================================
    // ACCOUNT CHECK
    // =================================================

    if (user.deletedAt) {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted",
      });
    }

    // =================================================
    // OTP VERIFICATION CHECK
    // =================================================

    if (!user.otpVerified) {
      return res.status(401).json({
        success: false,
        message: "OTP verification required",
      });
    }

    if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
      user.otpVerified = false;
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "OTP verification expired. Please request a new OTP.",
      });
    }

    // =================================================
    // HASH NEW PASSWORD
    // =================================================

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Password hashed successfully");

    // =================================================
    // UPDATE DATABASE DIRECTLY
    // =================================================

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        email: normalizedEmail,
        otpVerified: true,
      },
      {
        $set: {
          password: hashedPassword,
          otp: null,
          otpExpiry: null,
          otpVerified: false,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message: "Password reset failed",
      });
    }

    console.log("PASSWORD UPDATED IN DATABASE");
    console.log("User ID:", updatedUser._id);
    console.log("=================================");

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// =====================================================
// REQUEST OTP FOR CHANGE PASSWORD
// LOGGED-IN ADMIN / CLIENT
// =====================================================

const requestChangePasswordOTP = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.deletedAt) {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted",
      });
    }

    if (user.role === "client" && user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is currently inactive",
      });
    }

    const otp = String(generateOTP());

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpVerified = false;

    await user.save();

    console.log("=================================");
    console.log(`🔑 PASSWORD CHANGE OTP FOR ${user.email}: ${otp}`);
    console.log("=================================");

    try {
      await sendMail(
        user.email,
        "Password Change Verification OTP - Ecom Web",
        `Hello ${user.name},\n\nYour 6-digit OTP code to verify changing your account password is: ${otp}.\n\nThis OTP code is valid for 10 minutes. If you did not request a password change, please ignore this email or secure your account.\n\nRegards,\nEcom Web Security Team`
      );
    } catch (mailErr) {
      console.error("Mail delivery note (OTP saved in DB & console):", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Verification OTP has been sent via SMTP to your email (${user.email}).`,
    });
  } catch (error) {
    console.error("REQUEST CHANGE PASSWORD OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send verification OTP",
    });
  }
};

// =====================================================
// CHANGE PASSWORD
// LOGGED-IN ADMIN / CLIENT
// =====================================================

const changePassword = async (req, res) => {
  try {
    const {
      newPassword,
      confirmPassword,
      otp,
    } = req.body;

    // =================================================
    // AUTH CHECK
    // =================================================

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation password are required",
      });
    }

    if (!otp || !String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Email verification OTP code is required to change password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    // =================================================
    // FIND USER
    // =================================================

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =================================================
    // ACCOUNT STATUS
    // =================================================

    if (user.deletedAt) {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted",
      });
    }

    if (
      user.role === "client" &&
      user.isActive === false
    ) {
      return res.status(403).json({
        success: false,
        message: "Your account is currently inactive",
      });
    }

    // =================================================
    // PREVENT SAME PASSWORD
    // =================================================

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password",
      });
    }

    // =================================================
    // VERIFY OTP
    // =================================================

    if (!user.otp || String(user.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification OTP code",
      });
    }

    if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Verification OTP has expired. Please request a new OTP.",
      });
    }

    // =================================================
    // HASH NEW PASSWORD
    // =================================================

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // =================================================
    // UPDATE DATABASE DIRECTLY
    // =================================================

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          password: hashedPassword,
          otp: null,
          otpExpiry: null,
          otpVerified: false,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message: "Password update failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  registerUser,
  registerAdmin,
  loginUser,
  forgotPassword,
  verifyOTP,
  resetPassword,
  requestChangePasswordOTP,
  changePassword,
};