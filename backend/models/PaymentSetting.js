const mongoose = require("mongoose");

const paymentSettingSchema = new mongoose.Schema(
  {
    upiId: {
      type: String,
      default: "merchant@upi",
    },
    upiQrUrl: {
      type: String,
      default: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=merchant@upi&pn=ECommerceStore&am=0",
    },
    upiPayeeName: {
      type: String,
      default: "E-Commerce Official Store",
    },
    codExtraCharge: {
      type: Number,
      default: 50,
    },
    enableUpi: {
      type: Boolean,
      default: true,
    },
    enableCard: {
      type: Boolean,
      default: true,
    },
    enableCod: {
      type: Boolean,
      default: true,
    },
    enableRazorpay: {
      type: Boolean,
      default: true,
    },
    razorpayKeyId: {
      type: String,
      default: "",
    },
    enableAutoAssignment: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.PaymentSetting || mongoose.model("PaymentSetting", paymentSettingSchema);
