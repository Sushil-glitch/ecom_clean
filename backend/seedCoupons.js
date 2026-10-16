const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const Coupon = require("./models/Coupon");

const sampleCoupons = [
  {
    code: "DEMO03",
    description: "Special Demo Promo Code - 20% OFF on all orders!",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 0,
    maxDiscountAmount: 500,
    usageLimit: 500,
    usedCount: 0,
    isActive: true,
  },
  {
    code: "WELCOME10",
    description: "Welcome Discount - 10% OFF",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 200,
    usageLimit: 1000,
    usedCount: 0,
    isActive: true,
  },
  {
    code: "FLAT100",
    description: "Flat ₹100 OFF on orders above ₹499",
    discountType: "fixed",
    discountValue: 100,
    minOrderAmount: 499,
    usageLimit: 200,
    usedCount: 0,
    isActive: true,
  },
];

async function seedCoupons() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mern-auth-app";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for coupon seeding...");

    for (const couponData of sampleCoupons) {
      await Coupon.findOneAndUpdate(
        { code: couponData.code },
        couponData,
        { upsert: true, new: true }
      );
      console.log(`Seeded coupon: ${couponData.code}`);
    }

    console.log("Coupons seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Coupon seeding error:", error);
    process.exit(1);
  }
}

seedCoupons();
