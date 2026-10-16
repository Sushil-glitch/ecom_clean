const Order = require("../models/Order");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const Notification = require("../models/Notification");
const sendMail = require("../utils/sendMail");
const autoAssignDelivery = require("../services/autoAssignDelivery");
const { updateDriverCapacity } = require("../services/deliveryCapacityService");

// =====================================================
// GET ASSIGNED ORDERS FOR LOGGED-IN DELIVERY BOY
// GET /api/delivery/orders
// =====================================================
const getDeliveryOrders = async (req, res) => {
  try {
    const deliveryBoyId = req.user?._id || req.user?.id;

    if (!deliveryBoyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { status, deliveryStatus } = req.query;

    const query = {
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
    };

    const targetStatus = status || deliveryStatus;
    if (targetStatus) {
      query.$and = [
        {
          $or: [
            { deliveryStatus: targetStatus },
            { "delivery.assignmentStatus": targetStatus },
          ],
        },
      ];
    }

    const orders = await Order.find(query)
      .populate("user", "name email contact")
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET DELIVERY ORDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching delivery orders",
    });
  }
};

// =====================================================
// GET SINGLE ORDER DETAILS FOR LOGGED-IN DELIVERY BOY
// GET /api/delivery/orders/:id
// =====================================================
const getDeliveryOrderById = async (req, res) => {
  try {
    const deliveryBoyId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!deliveryBoyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const order = await Order.findOne({
      _id: id,
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
    }).populate("user", "name email contact");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("GET DELIVERY ORDER BY ID ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while fetching order details",
    });
  }
};

// =====================================================
// GET DELIVERY BOY STATS
// GET /api/delivery/stats
// =====================================================
const getDeliveryStats = async (req, res) => {
  try {
    const deliveryBoyId = req.user?._id || req.user?.id;

    if (!deliveryBoyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const assignedCount = await Order.countDocuments({
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
      $and: [
        {
          $or: [
            { deliveryStatus: "Assigned" },
            { "delivery.assignmentStatus": "Assigned" },
          ],
        },
      ],
    });

    const acceptedCount = await Order.countDocuments({
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
      $and: [
        {
          $or: [
            { deliveryStatus: "Accepted" },
            { "delivery.assignmentStatus": "Accepted" },
          ],
        },
      ],
    });

    const pickedUpCount = await Order.countDocuments({
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
      $and: [
        {
          $or: [
            { deliveryStatus: "Picked Up" },
            { "delivery.assignmentStatus": "Picked Up" },
          ],
        },
      ],
    });

    const outForDeliveryCount = await Order.countDocuments({
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
      $and: [
        {
          $or: [
            { deliveryStatus: "Out for Delivery" },
            { "delivery.assignmentStatus": "Out for Delivery" },
          ],
        },
      ],
    });

    const deliveredCount = await Order.countDocuments({
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
      $and: [
        {
          $or: [
            { deliveryStatus: "Delivered" },
            { "delivery.assignmentStatus": "Delivered" },
          ],
        },
      ],
    });

    const totalOrders = await Order.countDocuments({
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
    });

    const driver = await User.findById(deliveryBoyId).select("-password -otp -otpExpiry -otpVerified");

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        assigned: assignedCount,
        accepted: acceptedCount,
        pickedUp: pickedUpCount,
        outForDelivery: outForDeliveryCount,
        delivered: deliveredCount,
        walletBalance: Number(driver?.walletBalance) || 0,
        cashInHand: Number(driver?.cashInHand) || 0,
        upiId: driver?.upiId || "",
        availabilityStatus: driver?.availabilityStatus || "available",
      },
      driver: driver || null,
    });
  } catch (error) {
    console.error("GET DELIVERY STATS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching delivery stats",
    });
  }
};

// =====================================================
// ACCEPT ORDER (Assigned -> Accepted)
// PUT /api/delivery/orders/:id/accept
// =====================================================
const acceptOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you",
      });
    }

    const currentStatus = order.deliveryStatus || order.delivery?.assignmentStatus || "Assigned";

    if (!["Assigned", "Unassigned", "Pending"].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order status is currently '${currentStatus}' and cannot be accepted.`,
      });
    }

    order.deliveryStatus = "Accepted";
    order.orderStatus = "Accepted";
    order.deliveryBoy = deliveryBoyId;
    if (!order.delivery) order.delivery = {};
    order.delivery.deliveryBoy = deliveryBoyId;
    order.delivery.assignmentStatus = "Accepted";
    order.acceptedAt = new Date();
    await order.save();

    // Admin & Client Notifications
    try {
      await Notification.create({
        recipientRole: "admin",
        title: `Delivery Accepted: #${order.orderId}`,
        message: `Delivery partner accepted order #${order.orderId}.`,
        type: "order",
        orderId: order.orderId,
      });

      if (order.user) {
        await Notification.create({
          recipientRole: "client",
          user: order.user?._id || order.user || null,
          title: `Delivery Partner Assigned: #${order.orderId}`,
          message: `Your order #${order.orderId} delivery partner has accepted the assignment and will pick up your package shortly.`,
          type: "order",
          orderId: order.orderId,
        });
      }
    } catch (notifErr) {
      console.error("Accept notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      order,
    });
  } catch (error) {
    console.error("ACCEPT ORDER ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while accepting order",
    });
  }
};

// =====================================================
// PICKUP ORDER (Accepted -> Picked Up)
// PUT /api/delivery/orders/:id/pickup
// =====================================================
const pickupOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you",
      });
    }

    const currentStatus = order.deliveryStatus || order.delivery?.assignmentStatus;

    if (!["Accepted", "Assigned"].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid delivery status transition from '${currentStatus}' to 'Picked Up'. Order must be in 'Accepted' or 'Assigned' status.`,
      });
    }

    order.deliveryStatus = "Picked Up";
    order.orderStatus = "Picked Up";
    if (order.delivery) {
      order.delivery.assignmentStatus = "Picked Up";
    }
    order.pickedUpAt = new Date();
    await order.save();

    // Admin & Client Notifications
    try {
      await Notification.create({
        recipientRole: "admin",
        title: `Order Picked Up: #${order.orderId}`,
        message: `Order #${order.orderId} has been picked up by the delivery partner.`,
        type: "order",
        orderId: order.orderId,
      });

      await Notification.create({
        recipientRole: "client",
        user: order.user || null,
        title: `Order Picked Up: #${order.orderId}`,
        message: `Your order #${order.orderId} has been picked up from our store/warehouse!`,
        type: "order",
        orderId: order.orderId,
      });
    } catch (notifErr) {
      console.error("Pickup notification error:", notifErr.message);
    }

    // Client Email Notification
    try {
      const clientEmail = order.clientInfo?.email;
      if (clientEmail) {
        await sendMail(
          clientEmail,
          `📦 Your Order #${order.orderId} Has Been Picked Up!`,
          `Hello ${order.clientInfo.name},\n\nYour order #${order.orderId} has been picked up by our driver partner and is preparing for dispatch.\n\nOrder ID: ${order.orderId}\nTotal Amount: ₹${order.totalAmount}\nDelivery Address: ${order.clientInfo.address}\n\nThank you for shopping with us!`
        );
      }
    } catch (mailErr) {
      console.error("Pickup client email error:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order picked up successfully",
      order,
    });
  } catch (error) {
    console.error("PICKUP ORDER ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while picking up order",
    });
  }
};

// =====================================================
// OUT FOR DELIVERY (Picked Up -> Out for Delivery)
// PUT /api/delivery/orders/:id/out-for-delivery
// =====================================================
const outForDeliveryOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you",
      });
    }

    const currentStatus = order.deliveryStatus || order.delivery?.assignmentStatus;

    if (!["Picked Up", "Accepted", "Assigned"].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid delivery status transition from '${currentStatus}' to 'Out for Delivery'. Order must be in 'Picked Up' or 'Accepted' status.`,
      });
    }

    // ALWAYS generate a FRESH 4-digit Delivery OTP at the exact moment driver starts Out for Delivery
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    order.deliveryOtp = deliveryOtp;
    order.deliveryStatus = "Out for Delivery";
    order.orderStatus = "Out for Delivery";
    if (order.delivery) {
      order.delivery.assignmentStatus = "Out for Delivery";
    }
    order.outForDeliveryAt = new Date();
    await order.save();

    // Client In-App Notification with Delivery OTP
    try {
      await Notification.create({
        recipientRole: "client",
        user: order.user?._id || order.user || null,
        title: `Out for Delivery: #${order.orderId}`,
        message: `Your order #${order.orderId} is out for delivery! Your 4-digit Delivery OTP is ${order.deliveryOtp}. Please share this OTP with your driver upon arrival.`,
        type: "order",
        orderId: order.orderId,
      });
    } catch (notifErr) {
      console.error("Out for delivery notification error:", notifErr.message);
    }

    // Client Email Notification with Delivery OTP
    try {
      const clientEmail = order.clientInfo?.email || order.user?.email;
      if (clientEmail) {
        await sendMail(
          clientEmail,
          `🚚 Your Order #${order.orderId} is Out for Delivery!`,
          `Hello ${order.clientInfo?.name || "Customer"},\n\nGreat news! Your order #${order.orderId} is out for delivery and will arrive shortly at your address:\n\nAddress: ${order.clientInfo?.address || "Registered Address"}\nTotal Amount: ₹${order.totalAmount} (${order.paymentMethod})\n\n🔐 4-Digit Delivery OTP: ${order.deliveryOtp}\n(Please provide this 4-digit OTP to the delivery driver upon arrival to receive your package.)\n\nThank you for shopping with us!`
        );
      }
    } catch (mailErr) {
      console.error("Out for delivery client email error:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to Out for Delivery. Delivery OTP (${deliveryOtp}) generated & sent to client!`,
      order,
      deliveryOtp,
    });
  } catch (error) {
    console.error("OUT FOR DELIVERY ORDER ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while updating order status to out for delivery",
    });
  }
};

// =====================================================
// DELIVER ORDER (Out for Delivery -> Delivered)
// PUT /api/delivery/orders/:id/delivered
// =====================================================
const deliverOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you",
      });
    }

    const currentStatus = order.deliveryStatus || order.delivery?.assignmentStatus;

    if (currentStatus !== "Out for Delivery") {
      return res.status(400).json({
        success: false,
        message: `Invalid delivery status transition from '${currentStatus}' to 'Delivered'. Order must be in 'Out for Delivery' status.`,
      });
    }

    // Verify Delivery OTP provided by customer
    const providedOtp = (req.body?.otp || "").toString().trim();
    if (order.deliveryOtp) {
      if (!providedOtp || providedOtp !== order.deliveryOtp.toString().trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid Delivery OTP code. Please ask the client for their 4-digit Delivery OTP.",
        });
      }
    }

    order.deliveryStatus = "Delivered";
    order.deliveredAt = new Date();
    order.orderStatus = "Completed";
    order.paymentStatus = "Completed";
    if (order.delivery) {
      order.delivery.assignmentStatus = "Delivered";
    }
    await order.save();

    // Release capacity for the delivery driver
    await updateDriverCapacity(deliveryBoyId);

    // Dynamically credit driver wallet for completed delivery and track COD cash collected
    try {
      const driver = await User.findById(deliveryBoyId);
      if (driver) {
        const basePay = 50; // ₹50 delivery commission per completed order

        if (order.paymentMethod === "COD") {
          // 1. If order is COD, track collected cash in hand. Commission released when Admin receives cash.
          const codCollectedAmount = Number(order.totalAmount || 0);
          driver.cashInHand = (Number(driver.cashInHand) || 0) + codCollectedAmount;
          order.codCommissionPending = true;

          await WalletTransaction.create({
            driver: deliveryBoyId,
            type: "cod_collection",
            amount: codCollectedAmount,
            upiId: driver.upiId || "",
            status: "Completed",
            balanceAfter: driver.walletBalance,
            description: `COD Cash Collected for Order #${order.orderId} (₹${basePay} commission unlocks upon admin settlement)`,
          });
        } else {
          // 2. If Prepaid order (UPI/Card), credit driver delivery commission fee immediately
          driver.walletBalance = (Number(driver.walletBalance) || 0) + basePay;

          await WalletTransaction.create({
            driver: deliveryBoyId,
            type: "credit",
            amount: basePay,
            upiId: driver.upiId || "",
            status: "Completed",
            balanceAfter: driver.walletBalance,
            description: `Delivery Commission Earned for Order #${order.orderId}`,
          });
        }

        // Check total completed deliveries for ₹500 Quest Bonus
        const deliveredCount = await Order.countDocuments({
          $or: [
            { deliveryBoy: deliveryBoyId },
            { "delivery.deliveryBoy": deliveryBoyId },
          ],
          $and: [
            {
              $or: [
                { deliveryStatus: "Delivered" },
                { "delivery.assignmentStatus": "Delivered" },
              ],
            },
          ],
        });

        if (deliveredCount === 5) {
          const questBonus = 500;
          driver.walletBalance = (Number(driver.walletBalance) || 0) + questBonus;
          await WalletTransaction.create({
            driver: deliveryBoyId,
            type: "credit",
            amount: questBonus,
            upiId: driver.upiId || "",
            status: "Completed",
            balanceAfter: driver.walletBalance,
            description: "🎉 5 Deliveries Performance Quest Bonus!",
          });
        }

        await driver.save();
      }
    } catch (walletErr) {
      console.error("Wallet credit & COD tracking error on deliverOrder:", walletErr.message);
    }

    // Admin & Client Notifications
    try {
      await Notification.create({
        recipientRole: "admin",
        title: `Order Delivered: #${order.orderId}`,
        message: `Order #${order.orderId} was marked as delivered by the driver.`,
        type: "order",
        orderId: order.orderId,
      });

      await Notification.create({
        recipientRole: "client",
        user: order.user || null,
        title: `Order Delivered: #${order.orderId}`,
        message: `Your order #${order.orderId} has been successfully delivered!`,
        type: "order",
        orderId: order.orderId,
      });
    } catch (notifErr) {
      console.error("Delivered notification error:", notifErr.message);
    }

    // Client Email Notification
    try {
      const clientEmail = order.clientInfo?.email;
      if (clientEmail) {
        await sendMail(
          clientEmail,
          `🎉 Your Order #${order.orderId} Has Been Delivered!`,
          `Hello ${order.clientInfo.name},\n\nYour order #${order.orderId} has been successfully delivered!\n\nOrder ID: ${order.orderId}\nTotal Amount: ₹${order.totalAmount}\n\nWe hope you enjoy your purchase. Thank you for shopping with us!`
        );
      }
    } catch (mailErr) {
      console.error("Delivered client email error:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order marked as Delivered successfully",
      order,
    });
  } catch (error) {
    console.error("DELIVER ORDER ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while marking order as delivered",
    });
  }
};

// =====================================================
// REJECT ORDER (Delivery partner rejects assigned order)
// PUT /api/delivery/orders/:id/reject
// =====================================================
const rejectOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      $or: [
        { deliveryBoy: deliveryBoyId },
        { "delivery.deliveryBoy": deliveryBoyId },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you",
      });
    }

    const currentStatus = order.deliveryStatus || order.delivery?.assignmentStatus;

    if (currentStatus !== "Assigned") {
      return res.status(400).json({
        success: false,
        message: `Order cannot be rejected when status is '${currentStatus}'. Must be in 'Assigned' status.`,
      });
    }

    // 1. Clear current assignment
    order.deliveryBoy = null;
    order.deliveryStatus = "Unassigned";
    order.assignedAt = null;

    if (!order.delivery) order.delivery = {};
    order.delivery.deliveryBoy = null;
    order.delivery.assignmentStatus = "Rejected";
    order.delivery.assignedAt = null;

    // 2. Track that this driver rejected this order to prevent immediate reassignment loops
    if (!Array.isArray(order.rejectedDeliveryBoys)) {
      order.rejectedDeliveryBoys = [];
    }
    if (!order.rejectedDeliveryBoys.some((bId) => bId.toString() === deliveryBoyId.toString())) {
      order.rejectedDeliveryBoys.push(deliveryBoyId);
    }

    await order.save();

    // 3. Update rejecting driver capacity (if capacity was full/busy)
    await updateDriverCapacity(deliveryBoyId);

    // 4. Admin notification
    try {
      await Notification.create({
        recipientRole: "admin",
        title: `Delivery Rejected: #${order.orderId}`,
        message: `Delivery partner rejected order #${order.orderId}. Attempting auto-reassignment...`,
        type: "order",
        orderId: order.orderId,
      });
    } catch (notifErr) {
      console.error("Admin rejection notification error:", notifErr.message);
    }

    // 5. Try auto-assigning to another eligible delivery partner
    const autoResult = await autoAssignDelivery(order._id);

    const reloadedOrder = await Order.findById(order._id).populate("deliveryBoy", "name email contact");

    return res.status(200).json({
      success: true,
      message: autoResult?.success
        ? "Order rejected and reassigned to another available delivery partner"
        : "Order rejected. No other delivery partner was available.",
      order: reloadedOrder,
      autoAssignment: autoResult,
    });
  } catch (error) {
    console.error("REJECT ORDER ERROR:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while rejecting order",
    });
  }
};

// POST /api/delivery/orders/:id/resend-otp
const resendDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.deliveryOtp) {
      order.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
      await order.save();
    }

    const clientEmail = order.clientInfo?.email || order.user?.email;

    try {
      await Notification.create({
        recipientRole: "client",
        user: order.user?._id || order.user || null,
        title: `Delivery OTP: #${order.orderId}`,
        message: `Your 4-digit Delivery OTP for order #${order.orderId} is ${order.deliveryOtp}. Please share this OTP with your driver upon arrival.`,
        type: "order",
        orderId: order.orderId,
      });
    } catch (nErr) {
      console.error("Resend OTP notification error:", nErr.message);
    }

    if (clientEmail) {
      await sendMail(
        clientEmail,
        `🔐 Delivery OTP for Order #${order.orderId}`,
        `Hello ${order.clientInfo?.name || "Customer"},\n\nYour 4-digit Delivery OTP for order #${order.orderId} is: ${order.deliveryOtp}.\n\nPlease provide this OTP to your driver when your order arrives.\n\nThank you!`
      );
    }

    return res.status(200).json({
      success: true,
      message: `Delivery OTP (${order.deliveryOtp}) resent successfully to ${clientEmail || "client notification"}!`,
      deliveryOtp: order.deliveryOtp,
    });
  } catch (error) {
    console.error("RESEND DELIVERY OTP ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error while resending delivery OTP" });
  }
};

module.exports = {
  getDeliveryOrders,
  getDeliveryOrderById,
  getDeliveryStats,
  acceptOrder,
  rejectOrder,
  pickupOrder,
  outForDeliveryOrder,
  deliverOrder,
  resendDeliveryOtp,
};
