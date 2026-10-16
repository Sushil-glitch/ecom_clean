const Razorpay = require("razorpay");
const crypto = require("crypto");

let razorpayInstance = null;

const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn("⚠️ Razorpay Key ID or Secret is missing in environment variables.");
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
};

/**
 * Creates an order on Razorpay servers
 * @param {Object} options - { amount (in INR), receipt, notes }
 * @returns {Promise<Object>} Razorpay Order Object
 */
const createRazorpayOrder = async ({ amount, receipt, notes = {} }) => {
  const instance = getRazorpayInstance();
  if (!instance) {
    throw new Error("Razorpay credentials are not configured on server.");
  }

  // Convert amount from INR to paise (integer)
  const amountInPaise = Math.round(Number(amount) * 100);

  if (amountInPaise <= 0) {
    throw new Error("Amount must be greater than zero for Razorpay order creation.");
  }

  const cleanReceipt = (receipt || `rcpt_${Date.now()}`).substring(0, 40);

  const orderOptions = {
    amount: amountInPaise,
    currency: "INR",
    receipt: cleanReceipt,
    notes: {
      platform: "ElectroZone",
      ...notes,
    },
  };

  const razorpayOrder = await instance.orders.create(orderOptions);
  return razorpayOrder;
};

/**
 * Verifies Razorpay HMAC SHA256 Signature
 * @param {Object} params - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {boolean}
 */
const verifyRazorpaySignature = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  return generatedSignature === razorpay_signature;
};

/**
 * Returns public configuration for client initialization
 */
const getRazorpayConfig = () => {
  return {
    isConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    keyId: process.env.RAZORPAY_KEY_ID || "",
  };
};

module.exports = {
  getRazorpayInstance,
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayConfig,
};
