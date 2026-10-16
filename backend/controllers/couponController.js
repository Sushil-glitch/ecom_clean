const Coupon = require("../models/Coupon");

// =====================================================
// VALIDATE COUPON FOR CLIENT CHECKOUT
// POST /api/coupons/validate
// =====================================================
const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a coupon promo code.",
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const orderSubtotal = Number(subtotal) || 0;

    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Invalid coupon code '${cleanCode}'.`,
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: `Coupon code '${cleanCode}' is currently inactive.`,
      });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: `Coupon code '${cleanCode}' has expired.`,
      });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: `Coupon code '${cleanCode}' has reached its maximum redemptions limit.`,
      });
    }

    if (orderSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order subtotal of ₹${coupon.minOrderAmount.toLocaleString("en-IN")} required to use this coupon.`,
      });
    }

    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((orderSubtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(orderSubtotal, coupon.discountValue);
    }

    return res.status(200).json({
      success: true,
      message: `Coupon '${cleanCode}' applied successfully! Saved ₹${discountAmount.toLocaleString("en-IN")}.`,
      discountAmount,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
      },
    });
  } catch (error) {
    console.error("VALIDATE COUPON ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while validating coupon code.",
    });
  }
};

// =====================================================
// GET ALL COUPONS (ADMIN)
// GET /api/coupons/admin/all
// =====================================================
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error("GET ALL COUPONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching coupons.",
    });
  }
};

// =====================================================
// CREATE COUPON (ADMIN)
// POST /api/coupons/admin
// =====================================================
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Coupon code is required." });
    }

    if (discountValue === undefined || Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, message: "Discount value must be greater than 0." });
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code '${cleanCode}' already exists. Please use a unique code.`,
      });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: (description || "").trim(),
      discountType: discountType === "fixed" ? "fixed" : "percentage",
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      usageLimit: Number(usageLimit) || 100,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return res.status(201).json({
      success: true,
      message: `Coupon '${cleanCode}' created successfully!`,
      coupon,
    });
  } catch (error) {
    console.error("CREATE COUPON ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating coupon.",
    });
  }
};

// =====================================================
// UPDATE COUPON (ADMIN)
// PUT /api/coupons/admin/:id
// =====================================================
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully!",
      coupon,
    });
  } catch (error) {
    console.error("UPDATE COUPON ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating coupon.",
    });
  }
};

// =====================================================
// DELETE COUPON (ADMIN)
// DELETE /api/coupons/admin/:id
// =====================================================
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' deleted successfully!`,
    });
  } catch (error) {
    console.error("DELETE COUPON ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting coupon.",
    });
  }
};

module.exports = {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
