const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const { ACTIVE_DELIVERY_STATUSES } = require("./deliveryCapacityService");

const autoAssignDelivery = async (orderId) => {
  try {
    // ==========================================
    // 1. GET & VALIDATE ORDER
    // ==========================================

    const orderQuery = mongoose.Types.ObjectId.isValid(orderId)
      ? { $or: [{ _id: orderId }, { orderId: orderId }] }
      : { orderId: orderId };

    const order = await Order.findOne(orderQuery);

    const PaymentSetting = require("../models/PaymentSetting");
    const setting = await PaymentSetting.findOne();
    if (setting && setting.enableAutoAssignment === false) {
      return {
        success: false,
        message: "Auto-assignment is currently disabled in store settings (Manual Assign Mode active).",
        autoAssignmentDisabled: true,
      };
    }

    if (!order) {
      return {
        success: false,
        message: "Order not found",
      };
    }

    // Prevent duplicate assignment if deliveryBoy already exists
    if (order.deliveryBoy) {
      return {
        success: false,
        message: "Order already has a delivery partner",
        deliveryBoy: order.deliveryBoy,
      };
    }

    // Do not assign cancelled, delivered, or completed orders
    const nonAssignableStatuses = ["Cancelled", "Delivered", "Completed"];
    if (nonAssignableStatuses.includes(order.orderStatus)) {
      return {
        success: false,
        message: `Cannot assign order with status '${order.orderStatus}'`,
      };
    }

    // ==========================================
    // 2. FIND ELIGIBLE DELIVERY PARTNERS
    // ==========================================

    // Primary query: Active delivery drivers available for auto assignment
    const primaryQuery = {
      role: "delivery",
      isActive: { $ne: false },
      deletedAt: null,
      availabilityStatus: "available",
      isAutoAssignmentEnabled: { $ne: false },
    };

    // Exclude drivers who rejected this order previously
    if (Array.isArray(order.rejectedDeliveryBoys) && order.rejectedDeliveryBoys.length > 0) {
      primaryQuery._id = { $nin: order.rejectedDeliveryBoys };
    }

    let deliveryPartners = await User.find(primaryQuery);

    // Fallback query: If no drivers are explicitly marked as "available", look for any active delivery partner who is not "busy"
    if (deliveryPartners.length === 0) {
      const fallbackQuery = {
        role: "delivery",
        isActive: { $ne: false },
        deletedAt: null,
        availabilityStatus: { $ne: "busy" },
        isAutoAssignmentEnabled: { $ne: false },
      };
      if (Array.isArray(order.rejectedDeliveryBoys) && order.rejectedDeliveryBoys.length > 0) {
        fallbackQuery._id = { $nin: order.rejectedDeliveryBoys };
      }
      deliveryPartners = await User.find(fallbackQuery);
    }

    if (deliveryPartners.length === 0) {
      return {
        success: false,
        message: "No active delivery partners are currently available in the system",
      };
    }

    // ==========================================
    // 3. FIND PARTNER WITH LOWEST WORKLOAD & TIE-BREAKER
    // ==========================================

    const candidates = [];

    for (const partner of deliveryPartners) {
      const activeOrderCount = await Order.countDocuments({
        $or: [
          { deliveryBoy: partner._id },
          { "delivery.deliveryBoy": partner._id },
        ],
        $and: [
          {
            $or: [
              { deliveryStatus: { $in: ACTIVE_DELIVERY_STATUSES } },
              { "delivery.assignmentStatus": { $in: ACTIVE_DELIVERY_STATUSES } },
            ],
          },
        ],
      });

      const completedDeliveriesCount = await Order.countDocuments({
        $or: [
          { deliveryBoy: partner._id },
          { "delivery.deliveryBoy": partner._id },
        ],
        $and: [
          {
            $or: [
              { deliveryStatus: { $in: ["Delivered", "Completed"] } },
              { "delivery.assignmentStatus": { $in: ["Delivered", "Completed"] } },
              { orderStatus: { $in: ["Delivered", "Completed"] } },
            ],
          },
        ],
      });

      const maxCapacity = partner.maxActiveOrders || 3;

      // Skip partner if at or over maximum capacity
      if (activeOrderCount >= maxCapacity) {
        if (partner.availabilityStatus !== "busy") {
          partner.availabilityStatus = "busy";
          await partner.save();
        }
        continue;
      }

      candidates.push({
        partner,
        activeOrders: activeOrderCount,
        completedDeliveries: completedDeliveriesCount,
        maxActiveOrders: maxCapacity,
        lastAssignedAt: partner.lastAssignedAt ? new Date(partner.lastAssignedAt).getTime() : 0,
        createdAt: partner.createdAt ? new Date(partner.createdAt).getTime() : 0,
      });
    }

    if (candidates.length === 0) {
      return {
        success: false,
        message: "All active delivery partners are at maximum capacity",
      };
    }

    // Sort candidates by:
    // 1. Lowest active orders (fewer ongoing orders currently in progress)
    // 2. Lowest total completed deliveries (fewer lifetime completed deliveries)
    // 3. Oldest lastAssignedAt (assigned least recently)
    // 4. Oldest createdAt (tie-breaker)
    candidates.sort((a, b) => {
      if (a.activeOrders !== b.activeOrders) {
        return a.activeOrders - b.activeOrders;
      }
      if (a.completedDeliveries !== b.completedDeliveries) {
        return a.completedDeliveries - b.completedDeliveries;
      }
      if (a.lastAssignedAt !== b.lastAssignedAt) {
        return a.lastAssignedAt - b.lastAssignedAt;
      }
      return a.createdAt - b.createdAt;
    });

    const selected = candidates[0];
    const selectedPartner = selected.partner;

    // ==========================================
    // 4. ATOMIC CONCURRENCY CHECK & ASSIGNMENT
    // ==========================================

    const currentActiveCount = await Order.countDocuments({
      $or: [
        { deliveryBoy: selectedPartner._id },
        { "delivery.deliveryBoy": selectedPartner._id },
      ],
      $and: [
        {
          $or: [
            { deliveryStatus: { $in: ACTIVE_DELIVERY_STATUSES } },
            { "delivery.assignmentStatus": { $in: ACTIVE_DELIVERY_STATUSES } },
          ],
        },
      ],
    });

    if (currentActiveCount >= selected.maxActiveOrders) {
      selectedPartner.availabilityStatus = "busy";
      await selectedPartner.save();
      return autoAssignDelivery(orderId);
    }

    const now = new Date();

    order.deliveryBoy = selectedPartner._id;
    order.deliveryStatus = "Assigned";
    order.assignedAt = now;

    if (!order.delivery) {
      order.delivery = {};
    }
    order.delivery.deliveryBoy = selectedPartner._id;
    order.delivery.assignmentStatus = "Assigned";
    order.delivery.assignmentType = "Automatic";
    order.delivery.assignedAt = now;

    await order.save();

    // Update partner lastAssignedAt and ensure availability status is active
    const newWorkload = currentActiveCount + 1;
    selectedPartner.lastAssignedAt = now;

    if (newWorkload >= selected.maxActiveOrders) {
      selectedPartner.availabilityStatus = "busy";
    } else if (selectedPartner.availabilityStatus === "offline") {
      selectedPartner.availabilityStatus = "available";
    }

    await selectedPartner.save();

    // Create notifications for assigned delivery partner and customer
    try {
      await Notification.create({
        recipientRole: "delivery",
        user: selectedPartner._id,
        title: `New Auto-Assigned Delivery: #${order.orderId}`,
        message: `Order #${order.orderId} for ${order.clientInfo?.name || "Customer"} has been automatically assigned to you.`,
        type: "order",
        orderId: order.orderId,
      });

      await Notification.create({
        recipientRole: "client",
        user: order.user || null,
        title: `Delivery Partner Assigned: #${order.orderId}`,
        message: `${selectedPartner.name || "A Delivery Partner"} has been assigned to deliver your order #${order.orderId}.`,
        type: "order",
        orderId: order.orderId,
      });
    } catch (notifErr) {
      console.error("Auto-assignment notification error:", notifErr.message);
    }

    return {
      success: true,
      message: `Delivery partner '${selectedPartner.name}' assigned automatically`,
      deliveryBoy: {
        _id: selectedPartner._id,
        name: selectedPartner.name,
        contact: selectedPartner.contact,
        email: selectedPartner.email,
      },
      activeOrders: newWorkload,
      maxActiveOrders: selected.maxActiveOrders,
    };
  } catch (error) {
    console.error("AUTO DELIVERY ASSIGNMENT ERROR:", error);

    return {
      success: false,
      message: "Automatic delivery assignment failed",
      error: error.message,
    };
  }
};

module.exports = autoAssignDelivery;