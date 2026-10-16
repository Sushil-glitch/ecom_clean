const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
      match: [
        /^\d{10}$/,
        "Mobile number must be exactly 10 digits and contain only numbers",
      ],
    },

    secondaryContact: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    secondaryEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // =========================
    // SAVED ADDRESSES
    // =========================

    addresses: [
      {
        label: {
          type: String,
          enum: ["Home", "Work", "Other"],
          default: "Home",
        },

        fullName: {
          type: String,
          required: true,
          trim: true,
        },

        phone: {
          type: String,
          required: true,
          trim: true,
          match: [
            /^\d{10}$/,
            "Phone number must be exactly 10 digits and contain only numbers",
          ],
        },

        addressLine: {
          type: String,
          required: true,
          trim: true,
        },

        city: {
          type: String,
          required: true,
          trim: true,
        },

        state: {
          type: String,
          required: true,
          trim: true,
        },

        pincode: {
          type: String,
          required: true,
          trim: true,
          match: [
            /^\d{6}$/,
            "Pincode must be exactly 6 digits and contain only numbers",
          ],
        },

        landmark: {
          type: String,
          default: "",
          trim: true,
        },

        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // =========================
    // ROLE
    // =========================

    role: {
      type: String,
      enum: ["admin", "client", "delivery"],
      default: "client",
    },

    // =========================
    // ACTIVE / INACTIVE STATUS
    // =========================

    isActive: {
      type: Boolean,
      default: true,
    },

    // =========================
    // BIN / DELETED STATUS
    // =========================

    deletedAt: {
      type: Date,
      default: null,
    },

    // =========================
    // FORGOT PASSWORD / OTP
    // =========================

    otp: {
      type: String,
      default: null,
    },

    otpExpiry: {
      type: Date,
      default: null,
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },

    // =========================
    // DELIVERY WALLET & PAYOUTS
    // =========================

    upiId: {
      type: String,
      default: "",
      trim: true,
    },

    walletBalance: {
      type: Number,
      default: 0,
    },

    cashInHand: {
      type: Number,
      default: 0,
    },

    // =========================
    // DELIVERY AVAILABILITY
    // =========================

    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "available",
    },

    maxActiveOrders: {
      type: Number,
      default: 3,
      min: 1,
    },

    isAutoAssignmentEnabled: {
      type: Boolean,
      default: true,
    },

    lastAssignedAt: {
      type: Date,
      default: null,
    },

    // =========================
    // DRIVER VEHICLE DETAILS
    // =========================

    vehicleDetails: {
      vehicleType: {
        type: String,
        default: "",
        trim: true,
      },
      vehicleModel: {
        type: String,
        default: "",
        trim: true,
      },
      bikeNumber: {
        type: String,
        default: "",
        trim: true,
      },
      licenseNumber: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // =========================
    // DELIVERY DRIVER RATINGS
    // =========================

    deliveryStats: {
      averageRating: {
        type: Number,
        default: 5.0,
        min: 1,
        max: 5,
      },
      totalRatingsCount: {
        type: Number,
        default: 0,
      },
      fiveStarCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// ADDRESS INVARIANT: Enforce EXACTLY 1 default address
// =====================================================
userSchema.pre("save", function (next) {
  if (this.addresses && this.addresses.length > 0) {
    const defaults = this.addresses.filter((a) => a.isDefault === true);
    if (defaults.length === 0) {
      // If no address is set as default, automatically make the first address default
      this.addresses[0].isDefault = true;
    } else if (defaults.length > 1) {
      // If multiple addresses are marked default, keep only the last set default
      let foundLastDefault = false;
      for (let i = this.addresses.length - 1; i >= 0; i--) {
        if (this.addresses[i].isDefault) {
          if (!foundLastDefault) {
            foundLastDefault = true;
          } else {
            this.addresses[i].isDefault = false;
          }
        }
      }
    }
  }
  next();
});

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);