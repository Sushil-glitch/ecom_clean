const User = require("../models/User");
const Order = require("../models/Order");

const ACTIVE_DELIVERY_STATUSES = [
  "Assigned",
  "Accepted",
  "Picked Up",
  "Out for Delivery",
];

/**
 * Recalculates active workload for a delivery partner and updates availabilityStatus if needed.
 * If activeOrders < maxActiveOrders and current status is "busy", restores status to "available".
 * IMPORTANT: Never changes an "offline" partner to "available".
 */
const updateDriverCapacity = async (driverId) => {
  if (!driverId) return;

  try {
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== "delivery") return;

    // Do not alter status if driver is offline
    if (driver.availabilityStatus === "offline") return;

    const activeOrders = await Order.countDocuments({
      $or: [
        { deliveryBoy: driver._id },
        { "delivery.deliveryBoy": driver._id },
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

    const maxCapacity = driver.maxActiveOrders || 3;

    if (activeOrders >= maxCapacity) {
      if (driver.availabilityStatus !== "busy") {
        driver.availabilityStatus = "busy";
        await driver.save();
      }
    } else {
      // If activeOrders < maxCapacity and currently busy, return to available
      if (driver.availabilityStatus === "busy") {
        driver.availabilityStatus = "available";
        await driver.save();
      }
    }
  } catch (error) {
    console.error("UPDATE DRIVER CAPACITY ERROR:", error);
  }
};

module.exports = {
  ACTIVE_DELIVERY_STATUSES,
  updateDriverCapacity,
};
