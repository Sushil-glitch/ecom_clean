const mongoose = require("mongoose");

const systemSettingSchema = new mongoose.Schema(
  {
    isMaintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "Site under maintenance so visit again later",
    },
    estimatedEndTime: {
      type: String,
      default: "Soon",
    },

    // SMTP EMAIL CONFIGURATION
    smtpUser: { type: String, default: "" },
    smtpPass: { type: String, default: "" },
    smtpHost: { type: String, default: "smtp.gmail.com" },
    smtpPort: { type: Number, default: 465 },
    smtpSecure: { type: Boolean, default: true },
    smtpFrom: { type: String, default: "" },

    // DYNAMIC HERO BANNERS
    heroBanners: [
      {
        id: { type: String, required: true },
        badge: { type: String, default: "⚡ Discover something you'll love" },
        title: { type: String, default: "Everything you need, all in one place." },
        subtitle: { type: String, default: "Shop the latest electronics, smart gadgets, computer accessories, books and more." },
        primaryCtaText: { type: String, default: "Shop Now" },
        primaryCtaLink: { type: String, default: "/shop" },
        secondaryCtaText: { type: String, default: "Create Account" },
        secondaryCtaLink: { type: String, default: "/register" },
        tagLine: { type: String, default: "Tech. Books. Gadgets." },
        imageUrl: { type: String, default: "" },
        bgGradient: { type: String, default: "from-blue-600 via-indigo-600 to-slate-900" },
        isActive: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemSetting", systemSettingSchema);
