const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// Helper to construct query handling both string and ObjectId user references
const getNotificationQuery = (req) => {
  const role = req.user?.role || "client";
  const userId = req.user?.id || req.user?._id;

  if (role === "admin") {
    return { recipientRole: "admin" };
  }

  const userConditions = [{ user: null }, { user: { $exists: false } }];

  if (userId) {
    userConditions.push({ user: userId });
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userConditions.push({ user: new mongoose.Types.ObjectId(userId) });
    }
  }

  return {
    recipientRole: role === "delivery" ? "delivery" : "client",
    $or: userConditions,
  };
};

// Get notifications for current user/role
exports.getNotifications = async (req, res) => {
  try {
    const query = getNotificationQuery(req);
    const userId = req.user?.id || req.user?._id;

    const rawNotifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const notifications = rawNotifications.map((n) => {
      const isReadByUser =
        n.isRead === true ||
        (userId && Array.isArray(n.readBy) && n.readBy.some((uId) => uId.toString() === userId.toString()));

      return {
        ...n,
        isRead: isReadByUser,
      };
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID" });
    }

    const baseQuery = getNotificationQuery(req);
    const query = { _id: id, ...baseQuery };

    const notification = await Notification.findOne(query);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found or access denied" });
    }

    const updateOps = { $set: { isRead: true } };
    if (userId) {
      updateOps.$addToSet = { readBy: userId };
    }

    await Notification.updateOne({ _id: id }, updateOps);

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("MARK AS READ ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const query = getNotificationQuery(req);
    const userId = req.user?.id || req.user?._id;

    const updateOps = { $set: { isRead: true } };
    if (userId) {
      updateOps.$addToSet = { readBy: userId };
    }

    await Notification.updateMany(query, updateOps);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("MARK ALL AS READ ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear notifications for current user/role
exports.clearNotifications = async (req, res) => {
  try {
    const role = req.user?.role || "client";
    const userId = req.user?.id || req.user?._id;

    let deleteQuery = {};
    if (role === "admin") {
      deleteQuery = { recipientRole: "admin" };
    } else if (userId) {
      deleteQuery = {
        recipientRole: role === "delivery" ? "delivery" : "client",
        user: userId,
      };
    } else {
      return res.status(400).json({ success: false, message: "User context required to clear notifications" });
    }

    await Notification.deleteMany(deleteQuery);
    res.json({ success: true, message: "Notifications cleared" });
  } catch (error) {
    console.error("CLEAR NOTIFICATIONS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
