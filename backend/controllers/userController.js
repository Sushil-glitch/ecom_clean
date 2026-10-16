const mongoose = require("mongoose");
const User = require("../models/User");
const Bin = require("../models/Bin");
const Order = require("../models/Order");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");

// =====================================================
// HELPERS
// =====================================================

const sanitizeUser = (user) => {
  if (!user) return null;

  const userObject = user.toObject
    ? user.toObject()
    : { ...user };

  delete userObject.password;
  delete userObject.otp;
  delete userObject.otpExpiry;
  delete userObject.otpVerified;

  return userObject;
};

// =====================================================
// VIEW PROFILE
// =====================================================
// VIEW PROFILE
// =====================================================

const getProfile = async (req, res) => {
  try {
    const id = req.params.id || req.user?.id || req.user?._id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const currentUserId = req.user?.id || req.user?._id;

    // Non-admins can only view their own profile
    if (
      req.user?.role !== "admin" &&
      currentUserId?.toString() !== id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own profile",
      });
    }

    let user = await User.findById(id);
    if (!user && req.user?.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// ADMIN DASHBOARD / ANALYTICS STATISTICS
// =====================================================

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    // =====================================================
    // DATE RANGES
    // =====================================================

    // Current month
    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    // Previous month
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const previousMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    // Last 7 months including current month
    const monthlyStart = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      1
    );

    // =====================================================
    // DATABASE QUERIES
    // =====================================================

    const [
      totalUsers,
      administrators,
      clients,
      activeUsers,
      inactiveUsers,
      deletedUsers,
      currentMonthUsers,
      previousMonthUsers,
      recentUsers,
      monthlyRegistrations,
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      revenueAggregation,
      recentOrdersList,
      lowStockProducts,
    ] = await Promise.all([
      // Total users currently in User collection
      User.countDocuments(),

      // Administrators
      User.countDocuments({
        role: "admin",
      }),

      // Clients
      User.countDocuments({
        role: "client",
      }),

      // Active users
      User.countDocuments({
        isActive: true,
      }),

      // Inactive users
      User.countDocuments({
        isActive: false,
      }),

      // Users currently inside Bin
      Bin.countDocuments(),

      // Current month registrations
      User.countDocuments({
        createdAt: {
          $gte: currentMonthStart,
        },
      }),

      // Previous month registrations
      User.countDocuments({
        createdAt: {
          $gte: previousMonthStart,
          $lt: previousMonthEnd,
        },
      }),

      // Five most recently registered users
      User.find()
        .select(
          "-password -otp -otpExpiry -otpVerified"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .lean(),

      // Monthly registrations
      User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: monthlyStart,
            },
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$createdAt",
              },

              month: {
                $month: "$createdAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      // Order Stats
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "Pending" }),
      Order.countDocuments({ orderStatus: "Processing" }),
      Order.countDocuments({ orderStatus: "Shipped" }),
      Order.countDocuments({ orderStatus: "Delivered" }),
      Order.countDocuments({ orderStatus: "Cancelled" }),
      Order.aggregate([
        { $match: { paymentStatus: { $in: ["Completed", "Verified"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
      Product.find({ stock: { $lte: 5 } }).select("name price stock category image").limit(5).lean(),
    ]);

    const totalRevenue = revenueAggregation[0]?.total || 0;

    // =====================================================
    // MONTHLY REGISTRATION DATA
    // =====================================================

    const monthlyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const found = monthlyRegistrations.find(
        (item) =>
          item._id.year === year &&
          item._id.month === month
      );

      monthlyData.push({
        month: date.toLocaleString("en-US", {
          month: "short",
        }),

        year,

        count: found ? found.count : 0,
      });
    }

    // =====================================================
    // MONTHLY GROWTH
    // =====================================================

    let growthRate = 0;

    if (previousMonthUsers === 0) {
      growthRate =
        currentMonthUsers > 0 ? 100 : 0;
    } else {
      growthRate =
        ((currentMonthUsers -
          previousMonthUsers) /
          previousMonthUsers) *
        100;
    }

    growthRate = Number(
      growthRate.toFixed(1)
    );

    // =====================================================
    // ACTIVE USER RATE
    // =====================================================

    const activityRate =
      totalUsers > 0
        ? Number(
            (
              (activeUsers / totalUsers) *
              100
            ).toFixed(1)
          )
        : 0;

    // =====================================================
    // ADMINISTRATOR PERCENTAGE
    // =====================================================

    const administratorPercentage =
      totalUsers > 0
        ? Number(
            (
              (administrators /
                totalUsers) *
              100
            ).toFixed(1)
          )
        : 0;

    // =====================================================
    // CLIENT PERCENTAGE
    // =====================================================

    const clientPercentage =
      totalUsers > 0
        ? Number(
            (
              (clients / totalUsers) *
              100
            ).toFixed(1)
          )
        : 0;

    // =====================================================
    // ACTIVE PERCENTAGE
    // =====================================================

    const activePercentage =
      totalUsers > 0
        ? Number(
            (
              (activeUsers /
                totalUsers) *
              100
            ).toFixed(1)
          )
        : 0;

    // =====================================================
    // INACTIVE PERCENTAGE
    // =====================================================

    const inactivePercentage =
      totalUsers > 0
        ? Number(
            (
              (inactiveUsers /
                totalUsers) *
              100
            ).toFixed(1)
          )
        : 0;

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        administrators,
        clients,
        deletedUsers,

        currentMonthUsers,
        previousMonthUsers,

        growthRate,
        activityRate,

        administratorPercentage,
        clientPercentage,

        activePercentage,
        inactivePercentage,
      },

      orderStats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
      },

      recentOrders: recentOrdersList,

      monthlyRegistrations: monthlyData,

      recentUsers,

      lowStockProducts,
    });
  } catch (error) {
    console.error(
      "DASHBOARD STATS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// ADMIN - VIEW ALL USERS
// =====================================================

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "-password -otp -otpExpiry -otpVerified"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    console.error(
      "GET ALL USERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// ADMIN - GET SINGLE USER
// =====================================================

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "GET USER BY ID ERROR:",
      error
    );

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
// ADMIN - UPDATE USER
// =====================================================

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      contact,
      email,
      role,
      isActive,
    } = req.body;

    // =================================================
    // FIND USER
    // =================================================

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =================================================
    // PREVENT ADMIN FROM CHANGING OWN ROLE
    // =================================================

    if (
      req.user.id === id &&
      role !== undefined &&
      role !== user.role
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot change your own role",
      });
    }

    // =================================================
    // NAME
    // =================================================

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    // =================================================
    // CONTACT
    // =================================================

    if (contact !== undefined) {
      const cleanContact = contact.toString().trim();
      if (!cleanContact || !/^\d{10}$/.test(cleanContact)) {
        return res.status(400).json({
          success: false,
          message: "Contact number must contain only numbers and be exactly 10 digits (cannot exceed 10 digits)",
        });
      }

      user.contact = cleanContact;
    }

    // =================================================
    // EMAIL
    // =================================================

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid email address",
        });
      }

      const emailExists =
        await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: id,
          },
        });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      user.email = normalizedEmail;
    }

    // =================================================
    // ROLE
    // =================================================

    if (role !== undefined) {
      const normalizedRole =
        role
          .toString()
          .trim()
          .toLowerCase();

      if (
        !["admin", "client", "delivery"].includes(
          normalizedRole
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role. Role must be admin, client, or delivery",
        });
      }

      user.role = normalizedRole;
    }

    // =================================================
    // ACTIVE STATUS
    // =================================================

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false",
        });
      }

      if (
        user.role === "admin" &&
        isActive === false
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Administrator accounts cannot be deactivated",
        });
      }

      user.isActive = isActive;
    }

    // =================================================
    // VEHICLE DETAILS (ADMIN OVERRIDE)
    // =================================================

    const inputVehicleDetails = req.body.vehicleDetails || {
      vehicleType: req.body.vehicleType,
      vehicleModel: req.body.vehicleModel,
      bikeNumber: req.body.bikeNumber,
      licenseNumber: req.body.licenseNumber,
    };

    if (
      inputVehicleDetails &&
      (inputVehicleDetails.vehicleType !== undefined ||
        inputVehicleDetails.vehicleModel !== undefined ||
        inputVehicleDetails.bikeNumber !== undefined ||
        inputVehicleDetails.licenseNumber !== undefined)
    ) {
      if (!user.vehicleDetails) {
        user.vehicleDetails = { vehicleType: "", vehicleModel: "", bikeNumber: "", licenseNumber: "" };
      }
      if (inputVehicleDetails.vehicleType !== undefined) {
        user.vehicleDetails.vehicleType = String(inputVehicleDetails.vehicleType).trim();
      }
      if (inputVehicleDetails.vehicleModel !== undefined) {
        user.vehicleDetails.vehicleModel = String(inputVehicleDetails.vehicleModel).trim();
      }
      if (inputVehicleDetails.bikeNumber !== undefined) {
        user.vehicleDetails.bikeNumber = String(inputVehicleDetails.bikeNumber).trim();
      }
      if (inputVehicleDetails.licenseNumber !== undefined) {
        user.vehicleDetails.licenseNumber = String(inputVehicleDetails.licenseNumber).trim();
      }
    }

    // =================================================
    // SAVE
    // =================================================

    await user.save();

    // =================================================
    // RETURN UPDATED USER
    // =================================================

    const updatedUser =
      await User.findById(id)
        .select(
          "-password -otp -otpExpiry -otpVerified"
        )
        .lean();

    return res.status(200).json({
      success: true,
      message:
        "User information updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "UPDATE USER ERROR:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// ADMIN - ACTIVATE / DEACTIVATE USER
// =====================================================

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Admin accounts cannot be deactivated
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Administrator accounts cannot be deactivated",
      });
    }

    user.isActive = !user.isActive;

    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isActive
        ? "User activated successfully"
        : "User deactivated successfully",

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
    console.error(
      "TOGGLE USER STATUS ERROR:",
      error
    );

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
// SOFT DELETE USER
// =====================================================

const softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Clients can only delete their own account
    if (
      req.user.role === "client" &&
      req.user.id !== id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only delete your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting administrators
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Administrator accounts cannot be deleted",
      });
    }

    // Move user to Bin
    await Bin.create({
      originalId: user._id,
      name: user.name,
      contact: user.contact,
      email: user.email,
      password: user.password,
      role: user.role,
      isActive: user.isActive,
      deletedAt: new Date(),
    });

    // Remove from active User collection
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Account moved to Bin successfully",
    });
  } catch (error) {
    console.error(
      "SOFT DELETE ERROR:",
      error
    );

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
// VIEW BIN
// =====================================================

const getBinUsers = async (req, res) => {
  try {
    const users = await Bin.find()
      .select("-password")
      .sort({
        deletedAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    console.error(
      "GET BIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// RESTORE USER
// =====================================================

const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser =
      await Bin.findById(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in Bin",
      });
    }

    // Check duplicate email
    const existingUser =
      await User.findOne({
        email: deletedUser.email,
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    await User.create({
      name: deletedUser.name,
      contact: deletedUser.contact,
      email: deletedUser.email,
      password: deletedUser.password,
      role: deletedUser.role,
      isActive: true,
      deletedAt: null,
    });

    await Bin.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User restored successfully",
    });
  } catch (error) {
    console.error(
      "RESTORE USER ERROR:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid Bin user ID",
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// HARD DELETE USER
// =====================================================

const hardDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser =
      await Bin.findById(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in Bin",
      });
    }

    await Bin.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User permanently deleted",
    });
  } catch (error) {
    console.error(
      "HARD DELETE ERROR:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid Bin user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// UPDATE PROFILE
// =====================================================

const updateProfile = async (req, res) => {
  try {
    const id = req.params.id || req.user?.id || req.user?._id;
    const { name, email, contact, currentPassword, newPassword, otp, vehicleDetails } = req.body;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID missing",
      });
    }

    const currentUserId = req.user?.id || req.user?._id;

    if (
      req.user?.role !== "admin" &&
      currentUserId &&
      currentUserId.toString() !== id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile",
      });
    }

    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    if (!user && req.user?.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Vehicle Details update & permanence logic
    const inputVehicleDetails = vehicleDetails || {
      vehicleType: req.body.vehicleType,
      vehicleModel: req.body.vehicleModel,
      bikeNumber: req.body.bikeNumber,
      licenseNumber: req.body.licenseNumber,
    };

    const hasVehicleInput =
      inputVehicleDetails &&
      (inputVehicleDetails.vehicleType !== undefined ||
        inputVehicleDetails.vehicleModel !== undefined ||
        inputVehicleDetails.bikeNumber !== undefined ||
        inputVehicleDetails.licenseNumber !== undefined);

    if (hasVehicleInput) {
      if (!user.vehicleDetails) {
        user.vehicleDetails = { vehicleType: "", vehicleModel: "", bikeNumber: "", licenseNumber: "" };
      }

      const isNonAdmin = req.user?.role !== "admin";
      const existingBikeNumber = user.vehicleDetails.bikeNumber
        ? user.vehicleDetails.bikeNumber.trim()
        : "";
      const newBikeNumber =
        inputVehicleDetails.bikeNumber !== undefined
          ? String(inputVehicleDetails.bikeNumber).trim()
          : undefined;

      // Enforcement: Bike number is permanent once entered by the driver and cannot be changed unless admin
      if (
        isNonAdmin &&
        existingBikeNumber &&
        newBikeNumber !== undefined &&
        newBikeNumber !== existingBikeNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Bike number is permanent once set. Only an administrator can edit your bike number.",
        });
      }

      if (inputVehicleDetails.vehicleType !== undefined) {
        user.vehicleDetails.vehicleType = String(inputVehicleDetails.vehicleType).trim();
      }
      if (inputVehicleDetails.vehicleModel !== undefined) {
        user.vehicleDetails.vehicleModel = String(inputVehicleDetails.vehicleModel).trim();
      }
      if (newBikeNumber !== undefined) {
        user.vehicleDetails.bikeNumber = newBikeNumber;
      }
      if (inputVehicleDetails.licenseNumber !== undefined) {
        user.vehicleDetails.licenseNumber = String(inputVehicleDetails.licenseNumber).trim();
      }
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      user.name = name.trim();
    }

    if (contact !== undefined) {
      const cleanContact = contact.toString().trim();
      if (!cleanContact || !/^\d{10}$/.test(cleanContact)) {
        return res.status(400).json({
          success: false,
          message: "Contact number must contain only numbers and be exactly 10 digits (cannot exceed 10 digits)",
        });
      }
      user.contact = cleanContact;
    }

    if (req.body.secondaryContact !== undefined) {
      user.secondaryContact = String(req.body.secondaryContact).trim();
    }

    if (req.body.secondaryEmail !== undefined) {
      user.secondaryEmail = String(req.body.secondaryEmail).trim().toLowerCase();
    }

    if (req.body.vehicleDetails !== undefined) {
      user.vehicleDetails = {
        ...(user.vehicleDetails || {}),
        ...req.body.vehicleDetails,
      };
    }

    if (req.body.availabilityStatus !== undefined) {
      user.availabilityStatus = req.body.availabilityStatus;
    }

    if (req.body.maxActiveOrders !== undefined) {
      user.maxActiveOrders = Number(req.body.maxActiveOrders);
    }

    if (req.body.isAutoAssignmentEnabled !== undefined) {
      user.isAutoAssignmentEnabled = Boolean(req.body.isAutoAssignmentEnabled);
    }

    if (req.body.upiId !== undefined) {
      user.upiId = String(req.body.upiId).trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const emailExists = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      user.email = normalizedEmail;
    }

    // Password Update Support via SMTP OTP
    if (newPassword) {
      if (!otp || !String(otp).trim()) {
        return res.status(400).json({
          success: false,
          message: "Email verification OTP code is required to change password",
        });
      }
      if (!user.otp || String(user.otp).trim() !== String(otp).trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification OTP code",
        });
      }
      if (!user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
        return res.status(400).json({
          success: false,
          message: "Verification OTP code has expired",
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
      }
      user.password = await bcrypt.hash(newPassword, 10);
      user.otp = null;
      user.otpExpiry = null;
      user.otpVerified = false;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email address already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors || {}).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: messages.join(", ") || "Validation failed",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
// =====================================================
// SAVED ADDRESSES
// =====================================================

// Helper to safely find user by ID or Email
const findUserFromReq = async (req) => {
  const userId = req.user?.id || req.user?._id;
  const userEmail = req.user?.email;

  const conditions = [];
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    conditions.push({ _id: userId });
  }
  if (userEmail) {
    conditions.push({ email: userEmail.toLowerCase().trim() });
  }

  if (conditions.length === 0) return null;
  return await User.findOne({ $or: conditions });
};

// Helper to safely find address subdocument
const findUserAddress = (user, addressId) => {
  if (!user || !user.addresses || !Array.isArray(user.addresses)) return null;
  if (typeof user.addresses.id === "function") {
    const subdoc = user.addresses.id(addressId);
    if (subdoc) return subdoc;
  }
  return user.addresses.find(
    (a) =>
      a._id?.toString() === addressId?.toString() ||
      a.id?.toString() === addressId?.toString()
  );
};

// GET ALL SAVED ADDRESSES
const getAddresses = async (req, res) => {
  try {
    const user = await findUserFromReq(req);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let modified = false;
    if (user.addresses && user.addresses.length > 0) {
      let foundDefault = false;
      let homeCount = 0;

      user.addresses.forEach((addr) => {
        // Enforce single default address
        if (addr.isDefault) {
          if (!foundDefault) {
            foundDefault = true;
          } else {
            addr.isDefault = false;
            modified = true;
          }
        }

        // Rename duplicate 'Home' addresses to 'Work' (Office)
        if (addr.label === "Home") {
          homeCount++;
          if (homeCount > 1) {
            addr.label = "Work";
            modified = true;
          }
        }
      });

      if (!foundDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
        modified = true;
      }

      if (modified) {
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    console.error("GET ADDRESSES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// ADD NEW ADDRESS
const addAddress = async (req, res) => {
  try {
    const {
      label,
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      landmark,
      isDefault,
    } = req.body;

    if (!fullName || !phone || !addressLine || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required address fields",
      });
    }

    const cleanPhone = phone.toString().trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    const cleanPincode = pincode.toString().trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must be exactly 6 digits",
      });
    }

    const user = await findUserFromReq(req);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Ensure valid label enum ("Home", "Work", "Other")
    const validLabel = ["Home", "Work", "Other"].includes(label) ? label : "Home";

    // Set newly added address as default if isDefault is true or if it's the user's first address
    const shouldBeDefault = isDefault === true || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      label: validLabel,
      fullName: fullName.trim(),
      phone: cleanPhone,
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: cleanPincode,
      landmark: landmark?.trim() || "",
      isDefault: shouldBeDefault,
    });

    await user.save();

    const newAddress = user.addresses[user.addresses.length - 1];

    return res.status(201).json({
      success: true,
      message: "Address saved successfully",
      address: newAddress,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("ADD ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// UPDATE ADDRESS
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await findUserFromReq(req);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const address = findUserAddress(user, addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const {
      label,
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      landmark,
      isDefault,
    } = req.body;

    if (isDefault === true) {
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });
      address.isDefault = true;
    }

    if (label !== undefined) {
      address.label = ["Home", "Work", "Other"].includes(label) ? label : "Home";
    }
    if (fullName !== undefined) address.fullName = fullName.trim();
    if (phone !== undefined) {
      const cleanPhone = phone.toString().trim();
      if (!/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be exactly 10 digits",
        });
      }
      address.phone = cleanPhone;
    }
    if (addressLine !== undefined) address.addressLine = addressLine.trim();
    if (city !== undefined) address.city = city.trim();
    if (state !== undefined) address.state = state.trim();
    if (pincode !== undefined) {
      const cleanPincode = pincode.toString().trim();
      if (!/^\d{6}$/.test(cleanPincode)) {
        return res.status(400).json({
          success: false,
          message: "Pincode must be exactly 6 digits",
        });
      }
      address.pincode = cleanPincode;
    }
    if (landmark !== undefined) address.landmark = landmark.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("UPDATE ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// DELETE ADDRESS
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await findUserFromReq(req);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const address = findUserAddress(user, addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;
    const targetId = address._id || address.id;

    if (typeof user.addresses.pull === "function") {
      user.addresses.pull(targetId);
    } else {
      user.addresses = user.addresses.filter((a) => (a._id || a.id)?.toString() !== targetId?.toString());
    }

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("DELETE ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// SET DEFAULT ADDRESS
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await findUserFromReq(req);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const selectedAddress = findUserAddress(user, addressId);
    if (!selectedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    user.addresses.forEach((address) => {
      address.isDefault = false;
    });

    selectedAddress.isDefault = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      address: selectedAddress,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("SET DEFAULT ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// DELETE OWN ACCOUNT (Self-Delete)
const deleteOwnAccount = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be deleted",
      });
    }

    await Bin.create({
      originalId: user._id,
      name: user.name,
      contact: user.contact,
      email: user.email,
      password: user.password,
      role: user.role,
      isActive: user.isActive,
      deletedAt: new Date(),
    });

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "Your account has been deleted successfully",
    });
  } catch (error) {
    console.error("DELETE OWN ACCOUNT ERROR:", error);

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
  getProfile,
  updateProfile,
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  softDeleteUser,
  deleteOwnAccount,
  getBinUsers,
  restoreUser,
  hardDeleteUser,

  // Saved Addresses
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};