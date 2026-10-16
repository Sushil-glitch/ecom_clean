const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const PaymentSetting = require("../models/PaymentSetting");
const Notification = require("../models/Notification");
const paymentController = require("./paymentController");
const autoAssignDelivery = require("../services/autoAssignDelivery");
const { updateDriverCapacity } = require("../services/deliveryCapacityService");

// =====================================================
// CREATE ORDER (Delegates to paymentController for secure server-side re-pricing & atomic stock reservation)
// =====================================================

const createOrder = async (req, res) => {
  return paymentController.createOrder(req, res);
};

// =====================================================
// GET ALL ORDERS - ADMIN
// =====================================================

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate(
        "user",
        "name email contact role"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET ALL ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
    });
  }
};

// =====================================================
// GET MY ORDERS - CLIENT
// =====================================================

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const orders = await Order.find({
      user: userId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching your orders",
    });
  }
};

// =====================================================
// GET ORDER BY MONGODB ID
// =====================================================

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate(
        "user",
        "name email contact role"
      )
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Client can only view their own order
    if (
      req.user?.role === "client" &&
      order.user &&
      order.user._id.toString() !==
        req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("GET ORDER BY ID ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while fetching order",
    });
  }
};

// =====================================================
// GET ORDER BY CUSTOM ORDER ID
// =====================================================

const getOrderByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      orderId,
    })
      .populate(
        "user",
        "name email contact role"
      )
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Client can only view their own order
    if (
      req.user?.role === "client" &&
      order.user &&
      order.user._id.toString() !==
        req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "GET ORDER BY ORDER ID ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error while fetching order",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: "Order status is required",
      });
    }

    const allowedStatuses = [
      "Awaiting Confirmation",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Store previous status & assigned driver before changing
    const previousStatus = order.orderStatus;
    const assignedDriverId = order.deliveryBoy || order.delivery?.deliveryBoy;

    // Update order status
    order.orderStatus = orderStatus;
    if ((orderStatus === "Delivered" || orderStatus === "Completed") && order.paymentMethod === "COD") {
      if (order.codCommissionPending === undefined) {
        order.codCommissionPending = true;
      }
    }

    await order.save();

    let assignmentResult = null;

    // =====================================================
    // AUTOMATIC DELIVERY ASSIGNMENT
    // Only when order status is Confirmed and auto-assign mode is ON
    // =====================================================

    const hasNoDeliveryPartner = !order.deliveryBoy;
    const paymentSettings = await PaymentSetting.findOne();
    const isAutoAssignMode = paymentSettings?.enableAutoAssignment !== false;

    if (orderStatus === "Confirmed" && hasNoDeliveryPartner && isAutoAssignMode) {
      assignmentResult = await autoAssignDelivery(
        order._id
      );

      console.log(
        "AUTO ASSIGNMENT RESULT:",
        assignmentResult
      );
    }

    // Release capacity if order status transitions to finished/cancelled
    if (["Delivered", "Completed", "Cancelled"].includes(orderStatus) && assignedDriverId) {
      await updateDriverCapacity(assignedDriverId);
    }

    // Get fresh order after possible assignment
    const updatedOrder = await Order.findById(id)
      .populate(
        "deliveryBoy",
        "name email contact availabilityStatus"
      );

    // Notify client, admin, and assigned delivery partner
    try {
      if (updatedOrder.user) {
        await Notification.create({
          recipientRole: "client",
          user: updatedOrder.user,
          title: `Order Status Updated: #${updatedOrder.orderId}`,
          message: `Your order #${updatedOrder.orderId} status has been updated to "${orderStatus}".`,
          type: "order",
          orderId: updatedOrder.orderId,
        });
      }

      await Notification.create({
        recipientRole: "admin",
        title: `Order #${updatedOrder.orderId} Updated`,
        message: `Order #${updatedOrder.orderId} status changed from "${previousStatus}" to "${orderStatus}".`,
        type: "order",
        orderId: updatedOrder.orderId,
      });

      if (assignmentResult?.success && assignmentResult.deliveryBoyId) {
        await Notification.create({
          recipientRole: "delivery",
          user: assignmentResult.deliveryBoyId,
          title: `New Delivery Assigned: #${updatedOrder.orderId}`,
          message: `Order #${updatedOrder.orderId} has been automatically assigned to you for delivery.`,
          type: "order",
          orderId: updatedOrder.orderId,
        });
      }
    } catch (notifErr) {
      console.error("Order status notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: assignmentResult?.success
        ? "Order confirmed and delivery partner assigned automatically"
        : "Order status updated successfully",

      order: updatedOrder,

      autoAssignment: assignmentResult,
    });
  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating order",
    });
  }
};

// =====================================================
// CANCEL ORDER - CLIENT
// =====================================================

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?.id || req.user?._id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Client can only cancel own order
    if (
      req.user?.role === "client" &&
      order.user &&
      order.user.toString() !==
        userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this order",
      });
    }

    // Don't allow cancelling completed/delivered orders
    if (
      ["Delivered", "Completed", "Cancelled"].includes(
        order.orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus}`,
      });
    }

    const assignedDriverId = order.deliveryBoy || order.delivery?.deliveryBoy;

    order.orderStatus = "Cancelled";

    await order.save();

    if (assignedDriverId) {
      await updateDriverCapacity(assignedDriverId);
    }

    // Notify Admin and Client
    try {
      await Notification.create({
        recipientRole: "admin",
        title: `Order Cancelled: #${order.orderId}`,
        message: `Order #${order.orderId} was cancelled by customer (${order.clientInfo?.name || "Client"}).`,
        type: "order",
        orderId: order.orderId,
      });

      if (order.user) {
        await Notification.create({
          recipientRole: "client",
          user: order.user,
          title: `Order Cancelled: #${order.orderId}`,
          message: `Your order #${order.orderId} has been cancelled successfully.`,
          type: "order",
          orderId: order.orderId,
        });
      }
    } catch (notifErr) {
      console.error("Cancel order notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("CANCEL ORDER ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling order",
    });
  }
};

// =====================================================
// RATE DELIVERY RIDER - CLIENT
// POST /api/orders/:id/rate-rider
// =====================================================

const rateRider = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review, tags } = req.body;

    const userId = req.user?.id || req.user?._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid rating between 1 and 5 stars.",
      });
    }

    const orderQuery = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { orderId: id }] }
      : { orderId: id };

    const order = await Order.findOne(orderQuery);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check ownership if client
    if (order.user && userId && order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to rate this order",
      });
    }

    // Ensure order is Delivered or Completed
    const isDelivered =
      ["Delivered", "Completed"].includes(order.orderStatus) ||
      ["Delivered", "Completed"].includes(order.deliveryStatus) ||
      ["Delivered", "Completed"].includes(order.delivery?.assignmentStatus);

    if (!isDelivered) {
      return res.status(400).json({
        success: false,
        message: "You can only rate the delivery partner after your order has been delivered.",
      });
    }

    const riderId = order.deliveryBoy || order.delivery?.deliveryBoy;

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "No delivery partner was assigned to this order.",
      });
    }

    // Save rating on order
    order.riderRating = {
      rating: Number(rating),
      review: String(review || "").trim(),
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()) : [],
      ratedAt: new Date(),
    };

    await order.save();

    // Recalculate rider's average rating in User model
    const ratedOrders = await Order.find({
      $or: [{ deliveryBoy: riderId }, { "delivery.deliveryBoy": riderId }],
      "riderRating.rating": { $ne: null },
    }).select("riderRating");

    const totalRatings = ratedOrders.length;
    const totalScore = ratedOrders.reduce(
      (sum, o) => sum + (o.riderRating?.rating || 0),
      0
    );
    const fiveStarCount = ratedOrders.filter(
      (o) => o.riderRating?.rating === 5
    ).length;
    const avgRating =
      totalRatings > 0 ? Number((totalScore / totalRatings).toFixed(1)) : 5.0;

    await User.findByIdAndUpdate(riderId, {
      deliveryStats: {
        averageRating: avgRating,
        totalRatingsCount: totalRatings,
        fiveStarCount: fiveStarCount,
      },
    });

    // Send notification to delivery driver
    try {
      await Notification.create({
        recipientRole: "delivery",
        user: riderId,
        title: `New Rating Received: ⭐ ${rating}/5`,
        message: `Customer rated your delivery for order #${order.orderId} with ${rating} stars.${
          review ? ` Note: "${review}"` : ""
        }`,
        type: "order",
        orderId: order.orderId,
      });
    } catch (notifErr) {
      console.error("Rider rating notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Thank you! Your delivery rating has been submitted.",
      riderRating: order.riderRating,
    });
  } catch (error) {
    console.error("RATE RIDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while submitting delivery rating",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  getOrderByOrderId,
  updateOrderStatus,
  cancelOrder,
  rateRider,
};