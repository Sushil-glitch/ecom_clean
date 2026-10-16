const mongoose = require("mongoose");
const Order = require("../models/Order");
const PaymentSetting = require("../models/PaymentSetting");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const sendMail = require("../utils/sendMail");
const User = require("../models/User");
const autoAssignDelivery = require("../services/autoAssignDelivery");
const { updateDriverCapacity } = require("../services/deliveryCapacityService");
const razorpayService = require("../services/razorpayService");

// Get Payment Settings
exports.getPaymentSettings = async (req, res) => {
  try {
    let settings = await PaymentSetting.findOne();
    if (!settings) {
      settings = await PaymentSetting.create({});
    }
    const cleanSettings = settings.toObject ? settings.toObject() : { ...settings };
    cleanSettings.razorpayKeyId = process.env.RAZORPAY_KEY_ID || settings.razorpayKeyId || "";
    cleanSettings.enableRazorpay = settings.enableRazorpay !== false && Boolean(process.env.RAZORPAY_KEY_ID);
    res.json({ success: true, settings: cleanSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Payment Settings (Admin)
exports.updatePaymentSettings = async (req, res) => {
  try {
    let settings = await PaymentSetting.findOne();
    if (!settings) {
      settings = new PaymentSetting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    const cleanSettings = settings.toObject ? settings.toObject() : { ...settings };
    cleanSettings.razorpayKeyId = process.env.RAZORPAY_KEY_ID || settings.razorpayKeyId || "";
    cleanSettings.enableRazorpay = settings.enableRazorpay !== false && Boolean(process.env.RAZORPAY_KEY_ID);
    res.json({ success: true, message: "Payment settings updated", settings: cleanSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Order & Process Payment Checkout
exports.createOrder = async (req, res) => {
  try {
    const {
      clientInfo,
      items,
      paymentMethod,
      paymentDetails,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items cannot be empty",
      });
    }

    if (!clientInfo || !clientInfo.name || !clientInfo.contact || !clientInfo.address) {
      return res.status(400).json({
        success: false,
        message: "Client shipping name, contact number, and address are required",
      });
    }

    const contactClean = clientInfo.contact.toString().trim();
    if (!/^\d{10}$/.test(contactClean)) {
      return res.status(400).json({
        success: false,
        message: "Contact number must contain only numbers and be exactly 10 digits (cannot exceed 10 digits)",
      });
    }

    // Load payment settings to get official COD extra charge server-side
    let paymentSettings = await PaymentSetting.findOne();
    const serverCodCharge = paymentMethod === "COD" ? Number(paymentSettings?.codExtraCharge || 50) : 0;

    // -------------------------------------------------
    // 1. RE-VALIDATE PRODUCTS & DB PRICES SERVER-SIDE
    // -------------------------------------------------
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const pId = item._id || item.id || item.productId;
      const requestedQty = Math.max(1, Number(item.qty || item.quantity || 1));

      if (!pId) {
        return res.status(400).json({
          success: false,
          message: "Invalid product item in order",
        });
      }

      const prod = await Product.findById(pId);

      if (!prod || prod.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `Product '${item.name || "Item"}' is unavailable or inactive`,
        });
      }

      if (prod.stock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product '${prod.name}'. Only ${prod.stock} left in stock.`,
        });
      }

      const dbPrice = Number(prod.price || 0);
      calculatedSubtotal += dbPrice * requestedQty;

      validatedItems.push({
        pId: prod._id,
        requestedQty,
        itemData: {
          id: prod._id.toString(),
          _id: prod._id.toString(),
          name: prod.name,
          price: dbPrice,
          quantity: requestedQty,
          qty: requestedQty,
          image: prod.image || "",
          category: prod.category || "General",
        },
      });
    }

    const finalSubtotal = calculatedSubtotal;
    const finalShippingFee = finalSubtotal > 0 ? 10 : 0;
    const finalCodCharge = serverCodCharge;
    const finalTotalAmount = finalSubtotal + finalShippingFee + finalCodCharge;

    // -------------------------------------------------
    // 2. ATOMIC STOCK DEDUCTION (PREVENT OVERSELLING)
    // -------------------------------------------------
    const deductedItems = [];

    for (const vItem of validatedItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: vItem.pId,
          isActive: true,
          stock: { $gte: vItem.requestedQty },
        },
        {
          $inc: { stock: -vItem.requestedQty },
        },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback any stock deducted in this loop
        for (const d of deductedItems) {
          await Product.updateOne(
            { _id: d.pId },
            { $inc: { stock: d.requestedQty } }
          );
        }

        return res.status(400).json({
          success: false,
          message: `Stock reservation failed for '${vItem.itemData.name}'. Product may be out of stock or deactivated.`,
        });
      }

      deductedItems.push(vItem);
    }

    // -------------------------------------------------
    // 3. GENERATE UNIQUE COLLISION-FREE ORDER ID
    // -------------------------------------------------
    const timeTag = Date.now().toString(36).toUpperCase();
    const randomTag = Math.floor(100000 + Math.random() * 900000);
    const orderId = `ORD-${timeTag}-${randomTag}`;
    const trackingNumber = `TRK-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    const estimatedDelivery = deliveryDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // -------------------------------------------------
    // 4. SANITIZE PAYMENT DETAILS & SET INITIAL STATUS
    // -------------------------------------------------
    const safePaymentDetails = {
      upiId: paymentDetails?.upiId || paymentSettings?.upiId || "",
      upiTransactionRef: (paymentDetails?.upiTransactionRef || "").trim(),
      cardLast4: paymentDetails?.cardLast4 ? String(paymentDetails.cardLast4).slice(-4) : "",
      cardHolder: (paymentDetails?.cardHolder || "").trim(),
      note: paymentMethod === "COD" 
        ? "Cash to be collected upon delivery" 
        : paymentMethod === "Razorpay"
        ? "Razorpay Online Payment"
        : "Demo payment mode",
      razorpayOrderId: (paymentDetails?.razorpayOrderId || "").trim(),
      razorpayPaymentId: (paymentDetails?.razorpayPaymentId || "").trim(),
      razorpaySignature: (paymentDetails?.razorpaySignature || "").trim(),
    };

    let paymentStatus = "Pending";
    if (paymentMethod === "COD") {
      paymentStatus = "Processing";
    } else if (paymentMethod === "Razorpay") {
      if (
        safePaymentDetails.razorpayOrderId &&
        safePaymentDetails.razorpayPaymentId &&
        safePaymentDetails.razorpaySignature
      ) {
        const isVerified = razorpayService.verifyRazorpaySignature({
          razorpay_order_id: safePaymentDetails.razorpayOrderId,
          razorpay_payment_id: safePaymentDetails.razorpayPaymentId,
          razorpay_signature: safePaymentDetails.razorpaySignature,
        });
        if (isVerified) {
          paymentStatus = "Completed";
          safePaymentDetails.note = `Payment verified online via Razorpay (${safePaymentDetails.razorpayPaymentId})`;
        }
      }
    }

    const orderStatus = "Awaiting Confirmation";
    const userId = req.user ? req.user._id : null;
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // -------------------------------------------------
    // 3.5 DUPLICATE ORDER SUBMISSION GUARD (IDEMPOTENCY)
    // -------------------------------------------------
    const recentDuplicateQuery = {
      "clientInfo.contact": clientInfo.contact,
      totalAmount: finalTotalAmount,
      createdAt: { $gte: new Date(Date.now() - 5000) },
    };
    if (userId) recentDuplicateQuery.user = userId;

    const recentDuplicate = await Order.findOne(recentDuplicateQuery);
    if (recentDuplicate) {
      // Rollback stock deducted for this duplicate request
      for (const d of deductedItems) {
        await Product.updateOne({ _id: d.pId }, { $inc: { stock: d.requestedQty } });
      }
      return res.status(200).json({
        success: true,
        order: recentDuplicate,
        message: "Order placed successfully",
      });
    }

    const order = new Order({
      orderId,
      user: userId,
      clientInfo,
      items: validatedItems.map((v) => v.itemData),
      subtotal: finalSubtotal,
      shippingFee: finalShippingFee,
      codCharge: finalCodCharge,
      totalAmount: finalTotalAmount,
      paymentMethod,
      paymentDetails: safePaymentDetails,
      paymentStatus,
      orderStatus,
      trackingNumber,
      estimatedDelivery,
      deliveryOtp,
    });

    await order.save();

    // -------------------------------------------------
    // 5. NOTIFY OWNER/ADMIN VIA SMTP EMAIL & IN-APP NOTIFICATION
    // -------------------------------------------------
    try {
      await Notification.create({
        recipientRole: "admin",
        title: `New Order Placed: #${order.orderId}`,
        message: `${clientInfo.name} placed a new order of ₹${finalTotalAmount}. Please review and confirm.`,
        type: "order",
        orderId: order.orderId,
      });

      if (userId) {
        await Notification.create({
          recipientRole: "client",
          user: userId,
          title: `Order Placed: #${order.orderId}`,
          message: `Your order of ₹${finalTotalAmount} has been submitted successfully and is awaiting confirmation.`,
          type: "order",
          orderId: order.orderId,
        });
      }
    } catch (notifErr) {
      console.error("Order notification creation error:", notifErr.message);
    }

    // Send Owner SMTP Email
    try {
      const ownerEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      if (ownerEmail) {
        const itemsSummary = validatedItems
          .map((v) => `- ${v.itemData.name} x ${v.requestedQty} (₹${v.itemData.price})`)
          .join("\n");

        await sendMail(
          ownerEmail,
          `🛒 New Order Placed (#${order.orderId}) - Action Required: Confirm Order`,
          `Hello Store Owner,\n\nA new order has been placed on your store and requires your confirmation!\n\nOrder Summary:\n- Order ID: ${order.orderId}\n- Client Name: ${clientInfo.name}\n- Client Email: ${clientInfo.email}\n- Phone: ${clientInfo.contact}\n- Address: ${clientInfo.address}\n- Payment Method: ${paymentMethod}\n- Total Amount: ₹${finalTotalAmount}\n\nItems Ordered:\n${itemsSummary}\n\nCurrent Status: Awaiting Owner Confirmation\n\nPlease log in to the Admin Dashboard to review and confirm this order.`
        );
      }
    } catch (emailErr) {
      console.error("Owner notification email error:", emailErr.message);
    }

    let razorpayOrderData = null;
    if (paymentMethod === "Razorpay" && paymentStatus !== "Completed") {
      try {
        const rzpOrder = await razorpayService.createRazorpayOrder({
          amount: finalTotalAmount,
          receipt: order.orderId,
          notes: {
            orderId: order.orderId,
            contact: clientInfo.contact,
          },
        });
        order.paymentDetails.razorpayOrderId = rzpOrder.id;
        await order.save();

        razorpayOrderData = {
          id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        };
      } catch (rzpErr) {
        console.error("Auto Razorpay order creation error in createOrder:", rzpErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
      razorpayOrder: razorpayOrderData,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Client Orders
exports.getClientOrders = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      const orConditions = [{ user: req.user._id }];
      if (req.user.email) {
        orConditions.push({ "clientInfo.email": req.user.email.toLowerCase().trim() });
      }
      query = { $or: orConditions };
    }
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("GET CLIENT ORDERS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Payments / Transactions (Admin)
exports.getPaymentHistory = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, payments: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Payment/Order Status (Admin)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, orderStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const previousStatus = order.orderStatus;
    const previousDriverId = order.deliveryBoy || order.delivery?.deliveryBoy;

    if (paymentStatus) order.paymentStatus = paymentStatus;

    if (orderStatus) {
      order.orderStatus = orderStatus;
      // Auto-complete COD payment if order is delivered/completed
      if ((orderStatus === "Completed" || orderStatus === "Delivered") && order.paymentMethod === "COD") {
        order.paymentStatus = "Completed";
        if (order.codCommissionPending === undefined) {
          order.codCommissionPending = true;
        }
      }
    }

    if (!order.deliveryOtp) {
      order.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    }

    if (order.paymentMethod === "COD" && order.paymentStatus === "Pending" && order.orderStatus === "Confirmed") {
      order.paymentStatus = "Processing";
    }

    await order.save();

    // =====================================================
    // AUTOMATIC DELIVERY ASSIGNMENT
    // =====================================================
    let assignmentResult = null;
    const hasNoDeliveryPartner = !order.deliveryBoy;
    const paymentSettings = await PaymentSetting.findOne();
    const isAutoAssignMode = paymentSettings?.enableAutoAssignment !== false;

    if (order.orderStatus === "Confirmed" && hasNoDeliveryPartner && isAutoAssignMode) {
      assignmentResult = await autoAssignDelivery(order._id);
      console.log("AUTO DELIVERY ASSIGNMENT:", assignmentResult);
    }

    // Release driver capacity if order is finished or cancelled
    if (["Delivered", "Completed", "Cancelled"].includes(order.orderStatus) && previousDriverId) {
      await updateDriverCapacity(previousDriverId);
    }

    // If order moved to Processing, notify client
    if (orderStatus === "Processing" && previousStatus !== "Processing") {
      try {
        await Notification.create({
          recipientRole: "client",
          user: order.user || null,
          title: `Order Processing: #${order.orderId}`,
          message: `Your order #${order.orderId} is now being packed & processed! You will receive your Delivery OTP when the package is out for delivery.`,
          type: "order",
          orderId: order.orderId,
        });
      } catch (notifErr) {
        console.error("Processing notification error:", notifErr.message);
      }
    }

    // If order was just confirmed, notify client
    if (order.orderStatus === "Confirmed" && previousStatus !== "Confirmed") {
      try {
        await Notification.create({
          recipientRole: "client",
          user: order.user || null,
          title: `Order Confirmed: #${order.orderId}`,
          message: `Your order #${order.orderId} for ₹${order.totalAmount} has been confirmed by the store owner!`,
          type: "order",
          orderId: order.orderId,
        });
      } catch (notifErr) {
        console.error("Client notification creation error:", notifErr.message);
      }

      try {
        const clientEmail = order.clientInfo?.email;
        if (clientEmail) {
          const itemsList = Array.isArray(order.items)
            ? order.items.map((i) => `- ${i.name} x ${i.qty || i.quantity || 1} (₹${i.price})`).join("\n")
            : "";

          await sendMail(
            clientEmail,
            `✅ Your Order #${order.orderId} has been Confirmed!`,
            `Hello ${order.clientInfo.name},\n\nGreat news! Your order #${order.orderId} has been officially confirmed by the store owner and is now being prepared for delivery.\n\nOrder Details:\n- Order ID: ${order.orderId}\n- Total Amount: ₹${order.totalAmount}\n- Payment Method: ${order.paymentMethod}\n- Estimated Delivery: ${order.estimatedDelivery || "3-5 business days"}\n\nItems Ordered:\n${itemsList}\n\n(Your Delivery OTP will be provided when your driver is out for delivery.)\n\nThank you for shopping with us!\nBest regards,\nStore Team`
          );
        }
      } catch (emailErr) {
        console.error("Client notification email error:", emailErr.message);
      }
    }

    const updatedOrder = await Order.findById(order._id).populate("deliveryBoy", "name email contact availabilityStatus");

    res.json({
      success: true,
      message: assignmentResult?.success
        ? "Status updated and delivery partner assigned automatically"
        : "Status updated successfully",
      order: updatedOrder,
      autoAssignment: assignmentResult,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Confirm Order by Owner/Admin
exports.confirmOrderByOwner = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      $or: [{ _id: id }, { orderId: id }],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = "Confirmed";
    if (!order.deliveryOtp) {
      order.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    }

    if (order.paymentMethod === "COD" && order.paymentStatus === "Pending") {
      order.paymentStatus = "Processing";
    }

    await order.save();

    // =====================================================
    // AUTOMATIC DELIVERY ASSIGNMENT
    // =====================================================
    let assignmentResult = null;
    const hasNoDeliveryPartner = !order.deliveryBoy;
    const paymentSettings = await PaymentSetting.findOne();
    const isAutoAssignMode = paymentSettings?.enableAutoAssignment !== false;

    if (hasNoDeliveryPartner && isAutoAssignMode) {
      assignmentResult = await autoAssignDelivery(order._id);
      console.log("AUTO DELIVERY ASSIGNMENT ON CONFIRM:", assignmentResult);
    }

    // -------------------------------------------------
    // NOTIFY CLIENT VIA SMTP EMAIL & IN-APP NOTIFICATION
    // -------------------------------------------------
    if (previousStatus !== "Confirmed") {
      try {
        await Notification.create({
          recipientRole: "client",
          user: order.user || null,
          title: `Order Confirmed: #${order.orderId}`,
          message: `Your order #${order.orderId} for ₹${order.totalAmount} has been confirmed by the store owner!`,
          type: "order",
          orderId: order.orderId,
        });
      } catch (notifErr) {
        console.error("Client notification creation error:", notifErr.message);
      }

      try {
        const clientEmail = order.clientInfo?.email;
        if (clientEmail) {
          const itemsList = Array.isArray(order.items)
            ? order.items.map((i) => `- ${i.name} x ${i.qty || 1} (₹${i.price})`).join("\n")
            : "";

          await sendMail(
            clientEmail,
            `✅ Your Order #${order.orderId} has been Confirmed!`,
            `Hello ${order.clientInfo.name},\n\nGreat news! Your order #${order.orderId} has been officially confirmed by the store owner and is now being prepared for delivery.\n\nOrder Details:\n- Order ID: ${order.orderId}\n- Total Amount: ₹${order.totalAmount}\n- Payment Method: ${order.paymentMethod}\n- Estimated Delivery: ${order.estimatedDelivery || "3-5 business days"}\n\nItems Ordered:\n${itemsList}\n\nThank you for shopping with us!\nBest regards,\nStore Team`
          );
        }
      } catch (emailErr) {
        console.error("Client notification email error:", emailErr.message);
      }
    }

    const updatedOrder = await Order.findById(order._id).populate(
      "deliveryBoy",
      "name email contact availabilityStatus"
    );

    res.json({
      success: true,
      message: assignmentResult?.success
        ? "Order confirmed and delivery partner assigned automatically!"
        : assignmentResult
        ? `Order confirmed, but no delivery partner was assigned: ${assignmentResult.message}`
        : "Order confirmed successfully!",
      order: updatedOrder,
      autoAssignment: assignmentResult,
    });
  } catch (error) {
    console.error("CONFIRM ORDER BY OWNER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Confirm Order Received (Client)
exports.confirmOrderReceived = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const order = await Order.findOne({
      $or: [{ _id: id }, { orderId: id }],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isOwner = order.user && order.user.toString() === (req.user.id || req.user._id).toString();
    const isEmailMatch = order.clientInfo?.email?.toLowerCase() === req.user.email?.toLowerCase();
    const isAdmin = req.user.role === "admin";

    if (!isAdmin && !isOwner && !isEmailMatch) {
      return res.status(403).json({ success: false, message: "You are not authorized to update this order" });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Cannot complete a cancelled order" });
    }

    order.orderStatus = "Completed";

    // If COD payment, mark paymentStatus as Completed upon receipt
    if (order.paymentMethod === "COD" || order.paymentStatus === "Processing" || order.paymentStatus === "Pending") {
      order.paymentStatus = "Completed";
    }

    await order.save();

    res.json({
      success: true,
      message: "Order confirmed as received and completed!",
      order,
    });
  } catch (error) {
    console.error("CONFIRM ORDER RECEIVED ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Order & Restock Items
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const order = await Order.findOne({
      $or: [{ _id: id }, { orderId: id }],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isOwner = order.user && order.user.toString() === (req.user.id || req.user._id).toString();
    const isEmailMatch = order.clientInfo?.email?.toLowerCase() === req.user.email?.toLowerCase();
    const isAdmin = req.user.role === "admin";

    if (!isAdmin && !isOwner && !isEmailMatch) {
      return res.status(403).json({ success: false, message: "You are not authorized to cancel this order" });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Order is already cancelled" });
    }

    const assignedBoyId = order.deliveryBoy || order.delivery?.deliveryBoy;

    order.orderStatus = "Cancelled";
    order.deliveryStatus = "Unassigned"; 
    order.deliveryBoy = null;
    await order.save();

    if (assignedBoyId) {
      await updateDriverCapacity(assignedBoyId);
    }

    // Restock items in MongoDB
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const pId = item.id || item._id;
        if (pId) {
          try {
            const prod = await Product.findById(pId);
            if (prod) {
              prod.stock = (prod.stock || 0) + Number(item.qty || item.quantity || 1);
              await prod.save();
            }
          } catch (err) {
            console.error(`Failed to restock product ${pId}:`, err);
          }
        }
      }
    }

    // Notify assigned delivery boy if order was assigned
    if (assignedBoyId) {
      try {
        await Notification.create({
          recipientRole: "delivery",
          user: assignedBoyId,
          title: `Delivery Cancelled: #${order.orderId}`,
          message: `Order #${order.orderId} assigned to you has been cancelled by customer/admin.`,
          type: "order",
          orderId: order.orderId,
        });
      } catch (notifErr) {
        console.error("Driver cancellation notification error:", notifErr.message);
      }
    }

    // Notify client
    try {
      await Notification.create({
        recipientRole: "client",
        user: order.user || null,
        title: `Order Cancelled: #${order.orderId}`,
        message: `Your order #${order.orderId} has been cancelled successfully.`,
        type: "order",
        orderId: order.orderId,
      });

      const clientEmail = order.clientInfo?.email;
      if (clientEmail) {
        await sendMail(
          clientEmail,
          `❌ Order #${order.orderId} Cancelled`,
          `Hello ${order.clientInfo.name},\n\nYour order #${order.orderId} has been cancelled as requested.\n\nIf you have any questions, please contact customer support.`
        );
      }
    } catch (clientNotifErr) {
      console.error("Client cancellation notification error:", clientNotifErr.message);
    }

    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================================
// RAZORPAY: CREATE DEDICATED PAYMENT ORDER
// POST /api/payments/razorpay/create-order
// =====================================================
exports.createRazorpayOrderHandler = async (req, res) => {
  try {
    const { amount, orderId, notes } = req.body;

    let targetAmount = Number(amount);
    let targetOrder = null;

    if (orderId) {
      const query = mongoose.Types.ObjectId.isValid(orderId)
        ? { $or: [{ _id: orderId }, { orderId }] }
        : { orderId };
      targetOrder = await Order.findOne(query);
      if (targetOrder) {
        targetAmount = Number(targetOrder.totalAmount);
      }
    }

    if (!targetAmount || targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid positive order amount is required to create Razorpay order",
      });
    }

    const receipt = targetOrder ? targetOrder.orderId : `rcpt_${Date.now()}`;
    const rzpOrder = await razorpayService.createRazorpayOrder({
      amount: targetAmount,
      receipt,
      notes: {
        orderId: targetOrder?.orderId || orderId || "",
        ...(notes || {}),
      },
    });

    if (targetOrder) {
      targetOrder.paymentDetails.razorpayOrderId = rzpOrder.id;
      await targetOrder.save();
    }

    return res.status(200).json({
      success: true,
      razorpayOrder: {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        receipt: rzpOrder.receipt,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("CREATE RAZORPAY ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create Razorpay order",
    });
  }
};

// =====================================================
// RAZORPAY: VERIFY PAYMENT SIGNATURE & COMPLETE ORDER
// POST /api/payments/razorpay/verify-payment
// =====================================================
exports.verifyRazorpayPaymentHandler = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay verification credentials (order ID, payment ID, or signature).",
      });
    }

    const isValid = razorpayService.verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid Razorpay signature.",
      });
    }

    // Locate internal order
    let order = null;
    if (orderId) {
      const query = mongoose.Types.ObjectId.isValid(orderId)
        ? { $or: [{ _id: orderId }, { orderId }] }
        : { orderId };
      order = await Order.findOne(query);
    } else {
      order = await Order.findOne({ "paymentDetails.razorpayOrderId": razorpay_order_id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order associated with this Razorpay transaction was not found.",
      });
    }

    // Mark order payment as Completed and auto-confirm verified order
    order.paymentStatus = "Completed";
    order.paymentMethod = "Razorpay";
    if (order.orderStatus === "Awaiting Confirmation" || order.orderStatus === "Pending") {
      order.orderStatus = "Confirmed";
    }
    order.paymentDetails.razorpayOrderId = razorpay_order_id;
    order.paymentDetails.razorpayPaymentId = razorpay_payment_id;
    order.paymentDetails.razorpaySignature = razorpay_signature;
    order.paymentDetails.note = `Online payment verified via Razorpay (Payment ID: ${razorpay_payment_id})`;

    // Check Auto Delivery Assignment setting
    try {
      const paymentSettings = await PaymentSetting.findOne();
      if (paymentSettings?.enableAutoAssignment !== false) {
        await autoAssignDelivery(order);
      }
    } catch (assignErr) {
      console.error("Auto assignment check error upon Razorpay verification:", assignErr.message);
    }

    await order.save();

    // Trigger Notifications
    try {
      if (order.user) {
        await Notification.create({
          recipientRole: "client",
          user: order.user,
          title: `Payment Verified: #${order.orderId}`,
          message: `Your payment of ₹${order.totalAmount} has been verified via Razorpay. Payment ID: ${razorpay_payment_id}.`,
          type: "order",
          orderId: order.orderId,
        });
      }

      await Notification.create({
        recipientRole: "admin",
        title: `Payment Received: #${order.orderId}`,
        message: `Online payment of ₹${order.totalAmount} received from ${order.clientInfo?.name} via Razorpay (ID: ${razorpay_payment_id}).`,
        type: "order",
        orderId: order.orderId,
      });

      const clientEmail = order.clientInfo?.email;
      if (clientEmail) {
        await sendMail(
          clientEmail,
          `✅ Payment Successful - Order #${order.orderId}`,
          `Hello ${order.clientInfo.name},\n\nWe have successfully received your payment of ₹${order.totalAmount} via Razorpay.\n\nTransaction Details:\n- Order ID: ${order.orderId}\n- Razorpay Payment ID: ${razorpay_payment_id}\n- Payment Method: Razorpay Online\n- Amount Paid: ₹${order.totalAmount}\n\nYour order is now confirmed and being processed.`
        );
      }
    } catch (notifErr) {
      console.error("Razorpay verification notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Payment successfully verified via Razorpay!",
      order,
    });
  } catch (error) {
    console.error("VERIFY RAZORPAY PAYMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while verifying Razorpay payment",
    });
  }
};
