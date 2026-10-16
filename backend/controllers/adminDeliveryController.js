const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const WalletTransaction = require("../models/WalletTransaction");
const { updateDriverCapacity } = require("../services/deliveryCapacityService");
const autoAssignDelivery = require("../services/autoAssignDelivery");

// Helper to sanitize user output
const sanitizeUser = (user) => {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.otp;
  delete userObj.otpExpiry;
  delete userObj.otpVerified;
  return userObj;
};

// =====================================================
// GET ALL DELIVERY BOYS
// GET /api/admin/delivery-boys
// =====================================================
const getDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await User.find({
      role: "delivery",
      deletedAt: null,
    }).select("-password -otp -otpExpiry -otpVerified").sort({ createdAt: -1 });

    const formatted = deliveryBoys.map((b) => {
      const obj = b.toObject ? b.toObject() : { ...b };
      obj.cashInHand = Number(obj.cashInHand) || 0;
      obj.walletBalance = Number(obj.walletBalance) || 0;
      return obj;
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      deliveryBoys: formatted,
    });
  } catch (error) {
    console.error("GET DELIVERY BOYS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching delivery boys",
    });
  }
};

// =====================================================
// CREATE NEW DELIVERY BOY
// POST /api/admin/delivery-boys
// =====================================================
const createDeliveryBoy = async (req, res) => {
  try {
    const { name, contact, email, password, vehicleType, vehicleModel, bikeNumber, licenseNumber, vehicleDetails } = req.body;

    if (!name || !contact || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, contact, email, password) are required",
      });
    }

    const cleanContact = contact.toString().trim();
    if (!/^\d{10}$/.test(cleanContact)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const vDetails = vehicleDetails || {
      vehicleType: vehicleType ? String(vehicleType).trim() : "",
      vehicleModel: vehicleModel ? String(vehicleModel).trim() : "",
      bikeNumber: bikeNumber ? String(bikeNumber).trim() : "",
      licenseNumber: licenseNumber ? String(licenseNumber).trim() : "",
    };

    const deliveryBoy = await User.create({
      name: name.trim(),
      contact: cleanContact,
      email: normalizedEmail,
      password: hashedPassword,
      role: "delivery",
      isActive: true,
      availabilityStatus: "available",
      isAutoAssignmentEnabled: true,
      vehicleDetails: vDetails,
    });

    return res.status(201).json({
      success: true,
      message: "Delivery boy created successfully",
      deliveryBoy: sanitizeUser(deliveryBoy),
    });
  } catch (error) {
    console.error("CREATE DELIVERY BOY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating delivery boy",
    });
  }
};

// =====================================================
// UPDATE DELIVERY BOY
// PUT /api/admin/delivery-boys/:id
// =====================================================
const updateDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, email, password, isActive, vehicleType, vehicleModel, bikeNumber, licenseNumber, vehicleDetails } = req.body;

    const deliveryBoy = await User.findOne({
      _id: id,
      role: "delivery",
      deletedAt: null,
    });

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy user not found",
      });
    }

    if (name) deliveryBoy.name = name.trim();

    if (contact) {
      const cleanContact = contact.toString().trim();
      if (!/^\d{10}$/.test(cleanContact)) {
        return res.status(400).json({
          success: false,
          message: "Mobile number must be exactly 10 digits",
        });
      }
      deliveryBoy.contact = cleanContact;
    }

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== deliveryBoy.email) {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email already in use",
          });
        }
        deliveryBoy.email = normalizedEmail;
      }
    }

    if (typeof isActive === "boolean") {
      deliveryBoy.isActive = isActive;
    }

    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }
      deliveryBoy.password = await bcrypt.hash(password.trim(), 10);
    }

    if (req.body.cashInHand !== undefined && req.body.cashInHand !== null) {
      const parsedCash = Number(req.body.cashInHand);
      if (!isNaN(parsedCash) && parsedCash >= 0) {
        deliveryBoy.cashInHand = parsedCash;
      }
    }

    // Vehicle details update by Admin (Admin CAN edit bike number)
    const inputVehicle = vehicleDetails || {
      vehicleType,
      vehicleModel,
      bikeNumber,
      licenseNumber,
    };

    if (
      inputVehicle &&
      (inputVehicle.vehicleType !== undefined ||
        inputVehicle.vehicleModel !== undefined ||
        inputVehicle.bikeNumber !== undefined ||
        inputVehicle.licenseNumber !== undefined)
    ) {
      if (!deliveryBoy.vehicleDetails) {
        deliveryBoy.vehicleDetails = { vehicleType: "", vehicleModel: "", bikeNumber: "", licenseNumber: "" };
      }
      if (inputVehicle.vehicleType !== undefined) {
        deliveryBoy.vehicleDetails.vehicleType = String(inputVehicle.vehicleType).trim();
      }
      if (inputVehicle.vehicleModel !== undefined) {
        deliveryBoy.vehicleDetails.vehicleModel = String(inputVehicle.vehicleModel).trim();
      }
      if (inputVehicle.bikeNumber !== undefined) {
        deliveryBoy.vehicleDetails.bikeNumber = String(inputVehicle.bikeNumber).trim();
      }
      if (inputVehicle.licenseNumber !== undefined) {
        deliveryBoy.vehicleDetails.licenseNumber = String(inputVehicle.licenseNumber).trim();
      }
    }

    await deliveryBoy.save();

    return res.status(200).json({
      success: true,
      message: "Delivery boy updated successfully",
      deliveryBoy: sanitizeUser(deliveryBoy),
    });
  } catch (error) {
    console.error("UPDATE DELIVERY BOY ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery boy ID format",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while updating delivery boy",
    });
  }
};

// =====================================================
// ASSIGN DELIVERY BOY TO ORDER
// PUT /api/admin/orders/:id/assign-delivery
// =====================================================
const assignDeliveryToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryBoyId } = req.body;

    if (!deliveryBoyId) {
      return res.status(400).json({
        success: false,
        message: "deliveryBoyId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(deliveryBoyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery boy ID format",
      });
    }

    // 1. Find Order (supports MongoDB _id or custom orderId)
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { orderId: id }] }
      : { orderId: id };

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 2. Requirement 9: Order must be confirmed by admin before assigning
    if (
      order.orderStatus === "Awaiting Confirmation" ||
      order.orderStatus === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be assigned because its current status is '${order.orderStatus}'. It must be confirmed first.`,
      });
    }

    // 3. Requirement 8: Target user must be active & role === "delivery"
    const deliveryBoy = await User.findOne({
      _id: deliveryBoyId,
      role: "delivery",
      isActive: { $ne: false },
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });

    if (!deliveryBoy) {
      return res.status(400).json({
        success: false,
        message: "Selected user is not an active delivery boy",
      });
    }

    const previousDriverId = order.deliveryBoy || order.delivery?.deliveryBoy;

    // 4. Update assignment atomically
    const assignedAt = new Date();
    const updatedOrder = await Order.findOneAndUpdate(
      query,
      {
        $set: {
          deliveryBoy: deliveryBoy._id,
          deliveryStatus: "Assigned",
          assignedAt: assignedAt,
          "delivery.deliveryBoy": deliveryBoy._id,
          "delivery.assignmentStatus": "Assigned",
          "delivery.assignmentType": "Manual",
          "delivery.assignedAt": assignedAt,
        },
      },
      { new: true }
    );

    // Update driver lastAssignedAt & capacity
    deliveryBoy.lastAssignedAt = assignedAt;
    await deliveryBoy.save();
    await updateDriverCapacity(deliveryBoy._id);

    if (previousDriverId && previousDriverId.toString() !== deliveryBoy._id.toString()) {
      await updateDriverCapacity(previousDriverId);
    }

    // 5. Create notifications for assigned delivery boy & client
    try {
      await Notification.create({
        recipientRole: "delivery",
        user: deliveryBoy._id,
        title: `New Delivery Assigned: #${updatedOrder.orderId}`,
        message: `Order #${updatedOrder.orderId} for ${updatedOrder.clientInfo?.name || "Customer"} has been assigned to you.`,
        type: "order",
        orderId: updatedOrder.orderId,
      });

      await Notification.create({
        recipientRole: "client",
        user: updatedOrder.user || null,
        title: `Delivery Partner Assigned: #${updatedOrder.orderId}`,
        message: `${deliveryBoy.name || "A Delivery Driver"} has been assigned to deliver your order #${updatedOrder.orderId}.`,
        type: "order",
        orderId: updatedOrder.orderId,
      });
    } catch (notifErr) {
      console.error("Delivery assignment notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order assigned to delivery boy successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("ASSIGN DELIVERY TO ORDER ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while assigning delivery boy to order",
    });
  }
};

// =====================================================
// UNASSIGN DELIVERY BOY FROM ORDER
// PUT /api/admin/orders/:id/unassign-delivery
// =====================================================
const unassignDeliveryFromOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { orderId: id }] }
      : { orderId: id };

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const previousDriverId = order.deliveryBoy || order.delivery?.deliveryBoy;

    const updatedOrder = await Order.findOneAndUpdate(
      query,
      {
        $set: {
          deliveryBoy: null,
          deliveryStatus: "Unassigned",
          assignedAt: null,
          acceptedAt: null,
          pickedUpAt: null,
          outForDeliveryAt: null,
          deliveredAt: null,
          "delivery.deliveryBoy": null,
          "delivery.assignmentStatus": "Unassigned",
          "delivery.assignedAt": null,
          "delivery.acceptedAt": null,
          "delivery.pickedUpAt": null,
          "delivery.outForDeliveryAt": null,
          "delivery.deliveredAt": null,
        },
      },
      { new: true }
    );

    if (previousDriverId) {
      await updateDriverCapacity(previousDriverId);
    }

    return res.status(200).json({
      success: true,
      message: "Delivery boy unassigned from order successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("UNASSIGN DELIVERY FROM ORDER ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while unassigning delivery boy",
    });
  }
};

// =====================================================
// AUTO ASSIGN DELIVERY BOY TO ORDER (TRIGGERED BY ADMIN)
// PUT /api/admin/orders/:id/auto-assign
// =====================================================
const autoAssignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { orderId: id }] }
      : { orderId: id };

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const result = await autoAssignDelivery(order._id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || "Failed to auto-assign delivery partner",
        autoAssignment: result,
      });
    }

    const updatedOrder = await Order.findById(order._id).populate(
      "deliveryBoy",
      "name email contact availabilityStatus"
    );

    return res.status(200).json({
      success: true,
      message: result.message || "Delivery partner assigned automatically",
      order: updatedOrder,
      autoAssignment: result,
    });
  } catch (error) {
    console.error("AUTO ASSIGN ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error during automatic delivery assignment",
    });
  }
};

// =====================================================
// SETTLE DRIVER COD CASH IN HAND (ADMIN ACTION)
// PUT /api/admin/delivery-boys/:id/settle-cash
// =====================================================
const settleDriverCash = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const driver = await User.findById(id);
    if (!driver || driver.role !== "delivery") {
      return res.status(404).json({ success: false, message: "Delivery driver not found" });
    }

    const currentCashInHand = Number(driver.cashInHand || 0);
    const settleAmount = amount ? Number(amount) : currentCashInHand;

    if (isNaN(settleAmount) || settleAmount <= 0) {
      return res.status(400).json({ success: false, message: "No cash in hand to settle" });
    }

    // Find delivered COD orders for this driver with pending commission
    const pendingCodOrders = await Order.find({
      $or: [{ deliveryBoy: id }, { "delivery.deliveryBoy": id }],
      paymentMethod: "COD",
      $or: [{ deliveryStatus: "Delivered" }, { "delivery.assignmentStatus": "Delivered" }],
      codCommissionPending: true,
    });

    let commissionToCredit = 0;
    if (pendingCodOrders.length > 0) {
      commissionToCredit = pendingCodOrders.length * 50;
      for (const ord of pendingCodOrders) {
        ord.codCommissionPending = false;
        await ord.save();
      }
    } else {
      // Fallback: ₹50 per cash settlement if no specific flag orders found
      commissionToCredit = 50;
    }

    const newCashInHand = Math.max(0, currentCashInHand - settleAmount);
    driver.cashInHand = newCashInHand;
    driver.walletBalance = (Number(driver.walletBalance) || 0) + commissionToCredit;
    await driver.save();

    await WalletTransaction.updateMany(
      { driver: id, type: "cash_deposit", status: "Pending" },
      { $set: { status: "Completed" } }
    );

    await WalletTransaction.create({
      driver: id,
      type: "cash_deposit",
      amount: settleAmount,
      status: "Completed",
      balanceAfter: driver.walletBalance,
      description: `COD Cash Deposit Settled by Store Admin (₹${settleAmount.toLocaleString("en-IN")})`,
    });

    await WalletTransaction.create({
      driver: id,
      type: "credit",
      amount: commissionToCredit,
      status: "Completed",
      balanceAfter: driver.walletBalance,
      description: `Delivery Commission Released by Admin after COD Cash Settlement (+₹${commissionToCredit})`,
    });

    try {
      await Notification.create({
        recipientRole: "delivery",
        user: id,
        title: `COD Cash Settled & Commission Credited: +₹${commissionToCredit}`,
        message: `Admin received ₹${settleAmount.toLocaleString("en-IN")} collected COD cash. Your ₹${commissionToCredit} delivery commission has been released to your wallet!`,
        type: "system",
      });
    } catch (notifErr) {
      console.error("Settlement notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully settled ₹${settleAmount.toLocaleString("en-IN")} cash & released ₹${commissionToCredit} commission to ${driver.name}`,
      cashInHand: newCashInHand,
      walletBalance: driver.walletBalance,
    });
  } catch (error) {
    console.error("SETTLE DRIVER CASH ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error while settling driver cash deposit" });
  }
};

// =====================================================
// GET COD CASH DEPOSITS (ADMIN VIEW)
// GET /api/admin/delivery-boys/cod-deposits
// =====================================================
const getCodDeposits = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { type: "cash_deposit" };

    if (status && status !== "all") {
      query.status = status;
    }

    const deposits = await WalletTransaction.find(query)
      .populate("driver", "name email contact cashInHand walletBalance")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: deposits.length,
      deposits,
    });
  } catch (error) {
    console.error("GET COD DEPOSITS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching COD deposit requests",
    });
  }
};

// =====================================================
// GET DRIVER APPRAISAL & PERFORMANCE REPORT (ADMIN)
// GET /api/admin/delivery-boys/:id/appraisal
// =====================================================
const getDriverAppraisal = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await User.findOne({ _id: id, role: "delivery" }).select(
      "-password -otp -otpExpiry -otpVerified"
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    // Dynamic query from Order collection for 100% DB persistence verification
    const ratedOrders = await Order.find({
      $or: [{ deliveryBoy: driver._id }, { "delivery.deliveryBoy": driver._id }],
      "riderRating.rating": { $ne: null },
    })
      .select("orderId clientInfo riderRating createdAt deliveredAt")
      .sort({ "riderRating.ratedAt": -1, updatedAt: -1 });

    const totalRatings = ratedOrders.length;
    const totalScore = ratedOrders.reduce(
      (sum, o) => sum + (o.riderRating?.rating || 0),
      0
    );

    const starCounts = {
      5: ratedOrders.filter((o) => o.riderRating?.rating === 5).length,
      4: ratedOrders.filter((o) => o.riderRating?.rating === 4).length,
      3: ratedOrders.filter((o) => o.riderRating?.rating === 3).length,
      2: ratedOrders.filter((o) => o.riderRating?.rating === 2).length,
      1: ratedOrders.filter((o) => o.riderRating?.rating === 1).length,
    };

    const avgRating =
      totalRatings > 0 ? Number((totalScore / totalRatings).toFixed(1)) : 5.0;
    const fiveStarPct =
      totalRatings > 0
        ? Number(((starCounts[5] / totalRatings) * 100).toFixed(1))
        : 100.0;

    const totalDeliveredOrders = await Order.countDocuments({
      $or: [{ deliveryBoy: driver._id }, { "delivery.deliveryBoy": driver._id }],
      $or: [
        { deliveryStatus: { $in: ["Delivered", "Completed"] } },
        { "delivery.assignmentStatus": { $in: ["Delivered", "Completed"] } },
        { orderStatus: { $in: ["Delivered", "Completed"] } },
      ],
    });

    let performanceBadge = "Satisfactory";
    let appraisalTier = "Tier 2 — Good Performer";

    if (totalRatings === 0) {
      performanceBadge = "New / Unrated";
      appraisalTier = "Probation — Awaiting Customer Reviews";
    } else if (avgRating >= 4.5) {
      performanceBadge = "Top Performer 🥇";
      appraisalTier = "Tier 1 — Eligible for Excellence Bonus 🎉";
    } else if (avgRating >= 4.0) {
      performanceBadge = "Good Performer 🟢";
      appraisalTier = "Tier 2 — Satisfactory Service";
    } else if (avgRating >= 3.0) {
      performanceBadge = "Average ⚡";
      appraisalTier = "Tier 3 — Requires Mentorship";
    } else {
      performanceBadge = "Below Standard ⚠️";
      appraisalTier = "Tier 4 — Performance Warning & Audit Required";
    }

    // Dynamic customer feedback list
    const customerReviews = ratedOrders.map((o) => ({
      orderId: o.orderId,
      customerName: o.clientInfo?.name || "Customer",
      rating: o.riderRating?.rating,
      review: o.riderRating?.review || "",
      tags: o.riderRating?.tags || [],
      ratedAt: o.riderRating?.ratedAt || o.createdAt,
    }));

    return res.status(200).json({
      success: true,
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        contact: driver.contact,
        vehicleDetails: driver.vehicleDetails,
        cashInHand: driver.cashInHand || 0,
        walletBalance: driver.walletBalance || 0,
        availabilityStatus: driver.availabilityStatus,
      },
      appraisalReport: {
        averageRating: avgRating,
        totalRatingsCount: totalRatings,
        starCounts,
        fiveStarPercentage: fiveStarPct,
        totalCompletedDeliveries: totalDeliveredOrders,
        performanceBadge,
        appraisalTier,
        reviews: customerReviews,
      },
    });
  } catch (error) {
    console.error("GET DRIVER APPRAISAL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating driver performance appraisal",
    });
  }
};

module.exports = {
  getDeliveryBoys,
  createDeliveryBoy,
  updateDeliveryBoy,
  assignDeliveryToOrder,
  unassignDeliveryFromOrder,
  autoAssignOrder,
  settleDriverCash,
  getCodDeposits,
  getDriverAppraisal,
};

