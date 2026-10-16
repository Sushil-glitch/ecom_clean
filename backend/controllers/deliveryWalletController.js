const User = require("../models/User");
const Order = require("../models/Order");
const WalletTransaction = require("../models/WalletTransaction");
const Notification = require("../models/Notification");

const MIN_WITHDRAWAL_AMOUNT = 1000;
const MIN_MAINTAIN_BALANCE = 500;

// =====================================================
// GET WALLET DETAILS FOR DRIVER (FULLY DYNAMIC)
// GET /api/delivery/wallet
// =====================================================
const getWalletDetails = async (req, res) => {
  try {
    const driverId = req.user?._id || req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const driver = await User.findById(driverId).select("name email contact upiId walletBalance cashInHand role");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver user not found",
      });
    }

    const currentBalance = Number(driver.walletBalance) || 0;
    const currentCashInHand = Number(driver.cashInHand) || 0;

    const deliveredCount = await Order.countDocuments({
      $or: [
        { deliveryBoy: driverId },
        { "delivery.deliveryBoy": driverId },
      ],
      $and: [
        {
          $or: [
            { deliveryStatus: "Delivered" },
            { "delivery.assignmentStatus": "Delivered" },
            { orderStatus: "Delivered" },
            { orderStatus: "Completed" },
          ],
        },
      ],
    });

    const transactions = await WalletTransaction.find({ driver: driverId })
      .sort({ createdAt: -1 })
      .limit(50);

    const maxWithdrawable = Math.max(0, currentBalance - MIN_MAINTAIN_BALANCE);

    return res.status(200).json({
      success: true,
      wallet: {
        balance: currentBalance,
        cashInHand: currentCashInHand,
        upiId: driver.upiId || "",
        minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
        minMaintainBalance: MIN_MAINTAIN_BALANCE,
        maxWithdrawable,
        canWithdraw: maxWithdrawable >= MIN_WITHDRAWAL_AMOUNT && Boolean(driver.upiId),
        stats: {
          deliveredCount,
        },
      },
      transactions,
    });
  } catch (error) {
    console.error("GET WALLET DETAILS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching wallet details",
    });
  }
};

// =====================================================
// UPDATE UPI ID
// PUT /api/delivery/wallet/upi
// =====================================================
const updateUpiId = async (req, res) => {
  try {
    const driverId = req.user?._id || req.user?.id;
    const { upiId } = req.body;

    if (!upiId || typeof upiId !== "string" || !upiId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid UPI ID (e.g., name@upi, 9876543210@paytm)",
      });
    }

    const cleanUpi = upiId.trim().toLowerCase();

    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(cleanUpi)) {
      return res.status(400).json({
        success: false,
        message: "Invalid UPI ID format. Expected format: username@bank or mobile@paytm",
      });
    }

    const driver = await User.findByIdAndUpdate(
      driverId,
      { upiId: cleanUpi },
      { new: true }
    ).select("upiId walletBalance");

    return res.status(200).json({
      success: true,
      message: "UPI ID updated successfully!",
      upiId: driver.upiId,
    });
  } catch (error) {
    console.error("UPDATE UPI ID ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating UPI ID",
    });
  }
};

// =====================================================
// REQUEST WITHDRAWAL (SUBMITS TO ADMIN APPROVAL QUEUE)
// POST /api/delivery/wallet/withdraw
// =====================================================
const requestWithdrawal = async (req, res) => {
  try {
    const driverId = req.user?._id || req.user?.id;
    const { amount, upiId: providedUpi } = req.body;

    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver user not found",
      });
    }

    const upiIdToUse = (providedUpi || driver.upiId || "").trim().toLowerCase();
    if (!upiIdToUse) {
      return res.status(400).json({
        success: false,
        message: "Please save your UPI ID before requesting a cash withdrawal.",
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid positive withdrawal amount.",
      });
    }

    if (numericAmount < MIN_WITHDRAWAL_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal failed: Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT.toLocaleString("en-IN")}.`,
      });
    }

    const currentBalance = Number(driver.walletBalance) || 0;

    if (numericAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal failed: Insufficient balance. Current wallet balance is ₹${currentBalance.toLocaleString("en-IN")}.`,
      });
    }

    const remainingBalance = currentBalance - numericAmount;

    if (remainingBalance < MIN_MAINTAIN_BALANCE) {
      const maxWithdrawable = Math.max(0, currentBalance - MIN_MAINTAIN_BALANCE);
      return res.status(400).json({
        success: false,
        message: `Withdrawal failed: You must maintain a minimum wallet balance of ₹${MIN_MAINTAIN_BALANCE.toLocaleString("en-IN")}. Maximum amount you can withdraw right now is ₹${maxWithdrawable.toLocaleString("en-IN")}.`,
      });
    }

    // Temporarily deduct balance pending admin approval
    driver.walletBalance = remainingBalance;
    if (!driver.upiId) {
      driver.upiId = upiIdToUse;
    }
    await driver.save();

    // Create Pending Withdrawal Transaction
    const transaction = await WalletTransaction.create({
      driver: driverId,
      type: "withdrawal",
      amount: numericAmount,
      upiId: upiIdToUse,
      status: "Pending",
      balanceAfter: remainingBalance,
      description: `UPI Cash Withdrawal Request to ${upiIdToUse} - Awaiting Admin Approval`,
    });

    // Notify Admin
    try {
      await Notification.create({
        recipientRole: "admin",
        title: `New UPI Payout Request: ₹${numericAmount.toLocaleString("en-IN")}`,
        message: `Driver ${driver.name} requested payout of ₹${numericAmount.toLocaleString("en-IN")} to UPI ID ${upiIdToUse}. Awaiting your approval in Admin Payments.`,
        type: "system",
      });
    } catch (notifErr) {
      console.error("Admin notification error for withdrawal:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Payout request of ₹${numericAmount.toLocaleString("en-IN")} to ${upiIdToUse} submitted! Awaiting admin transfer approval.`,
      wallet: {
        balance: remainingBalance,
        upiId: driver.upiId,
        minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
        minMaintainBalance: MIN_MAINTAIN_BALANCE,
        maxWithdrawable: Math.max(0, remainingBalance - MIN_MAINTAIN_BALANCE),
      },
      transaction,
    });
  } catch (error) {
    console.error("REQUEST WITHDRAWAL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing cash withdrawal request",
    });
  }
};

// =====================================================
// DEPOSIT COLLECTED COD CASH
// POST /api/delivery/wallet/deposit-cash
// =====================================================
const depositCash = async (req, res) => {
  try {
    const driverId = req.user?._id || req.user?.id;
    const { amount } = req.body;

    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver user not found" });
    }

    const currentCashInHand = Number(driver.cashInHand || 0);
    const depositAmount = Number(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ success: false, message: "Please enter a valid deposit amount." });
    }

    if (depositAmount > currentCashInHand) {
      return res.status(400).json({
        success: false,
        message: `Deposit amount (₹${depositAmount.toLocaleString("en-IN")}) exceeds pending Cash in Hand (₹${currentCashInHand.toLocaleString("en-IN")}).`,
      });
    }

    const transaction = await WalletTransaction.create({
      driver: driverId,
      type: "cash_deposit",
      amount: depositAmount,
      status: "Pending",
      balanceAfter: driver.walletBalance,
      description: `COD Cash Deposit Submitted to Admin (₹${depositAmount.toLocaleString("en-IN")}) - Pending Settlement`,
    });

    try {
      await Notification.create({
        recipientRole: "admin",
        title: `COD Cash Settlement Submitted: ₹${depositAmount.toLocaleString("en-IN")}`,
        message: `Driver ${driver.name} (${driver.email}) submitted ₹${depositAmount.toLocaleString("en-IN")} collected COD cash for admin settlement.`,
        type: "system",
      });
    } catch (notifErr) {
      console.error("Deposit notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully submitted ₹${depositAmount.toLocaleString("en-IN")} collected COD cash to store admin! Settlement pending approval.`,
      cashInHand: currentCashInHand,
      transaction,
    });
  } catch (error) {
    console.error("DEPOSIT CASH ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing cash deposit",
    });
  }
};

// =====================================================
// GET PAYOUT & SETTLEMENT REQUESTS (ADMIN)
// GET /api/admin/payouts
// =====================================================
const getPayoutRequests = async (req, res) => {
  try {
    const requests = await WalletTransaction.find({
      type: { $in: ["withdrawal", "cash_deposit"] },
    })
      .populate("driver", "name email contact upiId walletBalance cashInHand")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("GET PAYOUT REQUESTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching payout requests.",
    });
  }
};

// =====================================================
// APPROVE PAYOUT REQUEST (ADMIN)
// PUT /api/admin/payouts/:id/approve
// =====================================================
const approvePayoutRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionRef } = req.body;

    const transaction = await WalletTransaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Payout request transaction not found." });
    }

    if (transaction.status === "Approved" || transaction.status === "Completed") {
      return res.status(400).json({ success: false, message: "This transaction has already been approved." });
    }

    const driver = await User.findById(transaction.driver);
    const refText = (transactionRef || "").trim();

    if (transaction.type === "withdrawal") {
      transaction.status = "Completed";
      transaction.description = `UPI Payout Approved & Transferred${refText ? ` (UTR: ${refText})` : ""}`;
      await transaction.save();

      // Send Notification to Driver
      if (driver) {
        try {
          await Notification.create({
            recipientUser: driver._id,
            title: `UPI Payout Approved: ₹${transaction.amount.toLocaleString("en-IN")}`,
            message: `Your withdrawal of ₹${transaction.amount.toLocaleString("en-IN")} to ${transaction.upiId} has been approved and transferred by Admin.${refText ? ` UTR Ref: ${refText}` : ""}`,
            type: "order",
          });
        } catch (e) {
          console.error("Driver notification error:", e);
        }
      }
    } else if (transaction.type === "cash_deposit") {
      // Deduct deposited amount from cashInHand
      if (driver) {
        driver.cashInHand = Math.max(0, (driver.cashInHand || 0) - transaction.amount);
        await driver.save();
      }

      transaction.status = "Completed";
      transaction.description = `COD Cash Deposit Settled by Admin${refText ? ` (Ref: ${refText})` : ""}`;
      await transaction.save();

      if (driver) {
        try {
          await Notification.create({
            recipientUser: driver._id,
            title: `COD Cash Deposit Settled: ₹${transaction.amount.toLocaleString("en-IN")}`,
            message: `Your COD cash deposit of ₹${transaction.amount.toLocaleString("en-IN")} has been verified and settled by Admin. Remaining liability: ₹${driver.cashInHand.toLocaleString("en-IN")}.`,
            type: "order",
          });
        } catch (e) {
          console.error("Driver notification error:", e);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Transaction ${transaction.type} approved successfully!`,
      transaction,
    });
  } catch (error) {
    console.error("APPROVE PAYOUT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while approving payout request.",
    });
  }
};

// =====================================================
// REJECT PAYOUT REQUEST (ADMIN)
// PUT /api/admin/payouts/:id/reject
// =====================================================
const rejectPayoutRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const transaction = await WalletTransaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction request not found." });
    }

    if (transaction.status === "Approved" || transaction.status === "Completed") {
      return res.status(400).json({ success: false, message: "Cannot reject an already completed transaction." });
    }

    const driver = await User.findById(transaction.driver);
    const rejectReasonText = (reason || "").trim() || "Administrative review decision";

    if (transaction.type === "withdrawal" && driver) {
      // Refund deducted wallet balance back to driver
      driver.walletBalance = (driver.walletBalance || 0) + transaction.amount;
      await driver.save();
    }

    transaction.status = "Rejected";
    transaction.description = `${transaction.description} - Rejected by Admin: ${rejectReasonText}`;
    await transaction.save();

    if (driver) {
      try {
        await Notification.create({
          recipientUser: driver._id,
          title: `Transaction Request Rejected: ₹${transaction.amount.toLocaleString("en-IN")}`,
          message: `Your ${transaction.type === "withdrawal" ? "UPI payout" : "COD cash deposit"} request of ₹${transaction.amount.toLocaleString("en-IN")} was rejected. Reason: ${rejectReasonText}.${transaction.type === "withdrawal" ? " Funds have been refunded to your wallet." : ""}`,
          type: "order",
        });
      } catch (e) {
        console.error("Driver notification error:", e);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Transaction request rejected. ${transaction.type === "withdrawal" ? "Funds refunded to driver wallet." : ""}`,
      transaction,
    });
  } catch (error) {
    console.error("REJECT PAYOUT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while rejecting payout request.",
    });
  }
};

module.exports = {
  getWalletDetails,
  updateUpiId,
  requestWithdrawal,
  depositCash,
  getPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
};
