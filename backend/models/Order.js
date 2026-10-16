const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // =====================================================
    // ORDER ID
    // =====================================================

    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // =====================================================
    // CLIENT / USER
    // =====================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // =====================================================
    // CLIENT INFORMATION
    // =====================================================

    clientInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      contact: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // =====================================================
    // ORDER ITEMS
    // =====================================================

    items: [
      {
        id: {
          type: String,
          required: true,
        },

        name: {
          type: String,
          required: true,
          trim: true,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        image: {
          type: String,
          default: "",
        },

        category: {
          type: String,
          default: "General",
        },
      },
    ],

    // =====================================================
    // AMOUNT DETAILS
    // =====================================================

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    codCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =====================================================
    // PAYMENT METHOD
    // =====================================================

    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "COD", "Razorpay"],
      required: true,
    },

    // =====================================================
    // PAYMENT DETAILS
    // =====================================================

    paymentDetails: {
      upiId: {
        type: String,
        default: "",
      },

      upiTransactionRef: {
        type: String,
        default: "",
      },

      cardLast4: {
        type: String,
        default: "",
      },

      cardHolder: {
        type: String,
        default: "",
      },

      note: {
        type: String,
        default: "",
      },

      razorpayOrderId: {
        type: String,
        default: "",
      },

      razorpayPaymentId: {
        type: String,
        default: "",
      },

      razorpaySignature: {
        type: String,
        default: "",
      },
    },

    // =====================================================
    // PAYMENT STATUS
    // =====================================================

    paymentStatus: {
      type: String,

      enum: [
        "Completed",
        "Pending",
        "Verified",
        "Failed",
        "Processing",
      ],

      default: "Pending",
    },

    // =====================================================
    // ORDER STATUS
    // =====================================================

    orderStatus: {
      type: String,

      enum: [
        "Awaiting Confirmation",
        "Confirmed",
        "Processing",
        "Accepted",
        "Picked Up",
        "Out for Delivery",
        "Shipped",
        "Delivered",
        "Completed",
        "Cancelled",
      ],

      default: "Awaiting Confirmation",
    },

    // =====================================================
    // SHIPPING / TRACKING
    // =====================================================

    trackingNumber: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
    },

    estimatedDelivery: {
      type: String,
      default: "",
    },

    deliveryOtp: {
      type: String,
      default: "",
    },

    // =====================================================
    // DELIVERY ASSIGNMENT
    // =====================================================

    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    deliveryStatus: {
      type: String,
      enum: [
        "Unassigned",
        "Assigned",
        "Accepted",
        "Picked Up",
        "Out for Delivery",
        "Delivered",
      ],
      default: "Unassigned",
      index: true,
    },

    codCommissionPending: {
      type: Boolean,
      default: false,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    pickedUpAt: {
      type: Date,
      default: null,
    },

    outForDeliveryAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    delivery: {
      // Delivery boy assigned to this order
      deliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      // Assignment status
      assignmentStatus: {
        type: String,

        enum: [
          "Unassigned",
          "Assigned",
          "Accepted",
          "Picked Up",
          "Out for Delivery",
          "Delivered",
          "Rejected",
        ],

        default: "Unassigned",
      },

      // How the order was assigned
      assignmentType: {
        type: String,

        enum: [
          "Manual",
          "Automatic",
        ],

        default: "Manual",
      },

      // When admin assigned the order
      assignedAt: {
        type: Date,
        default: null,
      },

      // When delivery boy accepted it
      acceptedAt: {
        type: Date,
        default: null,
      },

      // When delivery boy picked it up
      pickedUpAt: {
        type: Date,
        default: null,
      },

      // When delivery boy started delivery
      outForDeliveryAt: {
        type: Date,
        default: null,
      },

      // When delivery was completed
      deliveredAt: {
        type: Date,
        default: null,
      },

      // Optional delivery notes
      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // Track delivery partners who rejected this order
    rejectedDeliveryBoys: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Customer review & star rating for assigned delivery partner
    riderRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      review: {
        type: String,
        default: "",
        trim: true,
      },
      tags: [
        {
          type: String,
          trim: true,
        },
      ],
      ratedAt: {
        type: Date,
        default: null,
      },
    },
  },

  {
    timestamps: true,
  }
);

// Pre-save middleware to keep top-level delivery fields and subdocument delivery fields in sync
orderSchema.pre("save", function (next) {
  if (this.paymentMethod === "COD" && this.codCommissionPending === undefined) {
    this.codCommissionPending = true;
  }
  if (!this.delivery) {
    this.delivery = {};
  }
  this.delivery.deliveryBoy = this.deliveryBoy;
  this.delivery.assignmentStatus = this.deliveryStatus;
  this.delivery.assignedAt = this.assignedAt;
  this.delivery.acceptedAt = this.acceptedAt;
  this.delivery.pickedUpAt = this.pickedUpAt;
  this.delivery.outForDeliveryAt = this.outForDeliveryAt;
  this.delivery.deliveredAt = this.deliveredAt;
  next();
});

// =====================================================
// INDEXES
// =====================================================

orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  deliveryBoy: 1,
  deliveryStatus: 1,
});

orderSchema.index({
  "delivery.deliveryBoy": 1,
  "delivery.assignmentStatus": 1,
});

orderSchema.index({
  orderStatus: 1,
});

orderSchema.index({
  paymentStatus: 1,
});

// =====================================================
// EXPORT
// =====================================================

module.exports =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);