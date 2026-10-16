const SystemSetting = require("../models/SystemSetting");
const sendMail = require("../utils/sendMail");

// GET /api/system/maintenance
const getMaintenanceStatus = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({
        isMaintenanceMode: false,
        maintenanceMessage: "Site under maintenance so visit again later",
        estimatedEndTime: "Soon",
      });
    }

    const envUser = process.env.SMTP_USER;
    const isEnvValid = envUser && envUser !== "your_email@gmail.com";

    return res.status(200).json({
      success: true,
      settings: {
        isMaintenanceMode: settings.isMaintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        estimatedEndTime: settings.estimatedEndTime,
        smtpUser: settings.smtpUser || (isEnvValid ? envUser : ""),
        smtpHost: settings.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com",
        smtpPort: settings.smtpPort || Number(process.env.SMTP_PORT) || 465,
        smtpConfigured: Boolean((settings.smtpUser && settings.smtpPass) || isEnvValid),
      },
    });
  } catch (error) {
    console.error("GET MAINTENANCE STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching maintenance status",
    });
  }
};

// PUT /api/system/maintenance (Admin Only)
const updateMaintenanceStatus = async (req, res) => {
  try {
    const { isMaintenanceMode, maintenanceMessage, estimatedEndTime, smtpUser, smtpPass, smtpHost, smtpPort } = req.body;

    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting();
    }

    if (typeof isMaintenanceMode === "boolean") {
      settings.isMaintenanceMode = isMaintenanceMode;
    }
    if (typeof maintenanceMessage === "string") {
      settings.maintenanceMessage = maintenanceMessage.trim();
    }
    if (typeof estimatedEndTime === "string") {
      settings.estimatedEndTime = estimatedEndTime.trim();
    }

    // SMTP Updates
    if (typeof smtpUser === "string") settings.smtpUser = smtpUser.trim();
    if (typeof smtpPass === "string" && smtpPass.trim()) settings.smtpPass = smtpPass.trim();
    if (typeof smtpHost === "string") settings.smtpHost = smtpHost.trim();
    if (smtpPort) settings.smtpPort = Number(smtpPort);

    await settings.save();

    return res.status(200).json({
      success: true,
      message: `System & SMTP settings updated successfully!`,
      settings,
    });
  } catch (error) {
    console.error("UPDATE MAINTENANCE STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating maintenance status",
    });
  }
};

// POST /api/system/smtp/test (Admin Only)
const testSmtpConnection = async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const emailToSend = targetEmail || req.user?.email;

    if (!emailToSend) {
      return res.status(400).json({ success: false, message: "Recipient email address is required for test." });
    }

    const result = await sendMail(
      emailToSend,
      "⚡ Ecom Platform SMTP Connection Test",
      `Congratulations! Your SMTP Mail service is properly configured and functioning on E-Commerce Platform. (Sent at ${new Date().toLocaleString()})`
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Test email sent successfully to ${emailToSend}! Check your inbox/spam folder.`,
        info: result.info,
      });
    } else if (result.skipped) {
      return res.status(400).json({
        success: false,
        message: "SMTP is not configured yet. Please enter your Gmail/SMTP email address and App Password in Admin Settings and click Save.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `SMTP test failed: ${result.error || "Bad credentials or blocked by SMTP server."}`,
      });
    }
  } catch (error) {
    console.error("TEST SMTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: `Server error during SMTP test: ${error.message}`,
    });
  }
};

const DEFAULT_HERO_BANNERS = [
  {
    id: "banner-1",
    badge: "⚡ Discover something you'll love",
    title: "Everything you need, all in one place.",
    subtitle: "Shop the latest electronics, smart gadgets, computer accessories, books and more. Find great products at prices you'll love.",
    primaryCtaText: "Shop Now",
    primaryCtaLink: "/shop",
    secondaryCtaText: "Create Account",
    secondaryCtaLink: "/register",
    tagLine: "Tech. Books. Gadgets.",
    imageUrl: "https://images.unsplash.com/photo-1498049860654-af1a5c566876?auto=format&fit=crop&w=1200&q=80",
    bgGradient: "from-slate-900 via-indigo-950 to-slate-900",
    isActive: true,
  },
  {
    id: "banner-2",
    badge: "🔥 Flash Sale — Up to 40% OFF",
    title: "Upgrade Your Tech Lifestyle Today",
    subtitle: "Premium smart devices, wireless headphones, and high-performance laptops backed by fast delivery and guaranteed quality.",
    primaryCtaText: "Explore Shop",
    primaryCtaLink: "/shop",
    secondaryCtaText: "View Featured",
    secondaryCtaLink: "/shop",
    tagLine: "Gadgets & Accessories",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    bgGradient: "from-blue-900 via-slate-900 to-indigo-950",
    isActive: true,
  },
  {
    id: "banner-3",
    badge: "🎮 Pro Gaming Gear & RGB Battlestations",
    title: "Level Up Your Battle Station",
    subtitle: "Mechanical keyboards, ultra-fast gaming mice, surround headsets, and esports peripherals engineered for victory.",
    primaryCtaText: "Shop Gaming Gear",
    primaryCtaLink: "/shop?category=Gaming%20Gear",
    secondaryCtaText: "Explore Audio",
    secondaryCtaLink: "/shop?category=Audio",
    tagLine: "Keyboards • Mice • Headsets",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    bgGradient: "from-purple-950 via-slate-900 to-indigo-950",
    isActive: true,
  },
];

// GET /api/system/hero-banners (Public)
const getHeroBanners = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings || !Array.isArray(settings.heroBanners) || settings.heroBanners.length === 0) {
      if (!settings) {
        settings = new SystemSetting({ heroBanners: DEFAULT_HERO_BANNERS });
      } else {
        settings.heroBanners = DEFAULT_HERO_BANNERS;
      }
      await settings.save();
    }

    const activeBanners = settings.heroBanners.filter((b) => b.isActive !== false);

    return res.status(200).json({
      success: true,
      banners: activeBanners.length > 0 ? activeBanners : DEFAULT_HERO_BANNERS,
      allBanners: settings.heroBanners,
    });
  } catch (error) {
    console.error("GET HERO BANNERS ERROR:", error);
    return res.status(200).json({
      success: true,
      banners: DEFAULT_HERO_BANNERS,
      allBanners: DEFAULT_HERO_BANNERS,
    });
  }
};

// PUT /api/system/hero-banners (Admin Only)
const updateHeroBanners = async (req, res) => {
  try {
    const { heroBanners } = req.body;

    if (!Array.isArray(heroBanners)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload: heroBanners must be an array.",
      });
    }

    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting();
    }

    settings.heroBanners = heroBanners;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Hero banners updated successfully!",
      banners: settings.heroBanners,
    });
  } catch (error) {
    console.error("UPDATE HERO BANNERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating hero banners.",
    });
  }
};

module.exports = {
  getMaintenanceStatus,
  updateMaintenanceStatus,
  testSmtpConnection,
  getHeroBanners,
  updateHeroBanners,
};
