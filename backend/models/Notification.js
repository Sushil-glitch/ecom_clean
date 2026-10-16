const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: {
      type: String,
      enum: ["admin", "client", "delivery"],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "order",
    },
    orderId: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
