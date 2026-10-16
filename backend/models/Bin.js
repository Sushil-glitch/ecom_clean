const mongoose = require("mongoose");

const binSchema = new mongoose.Schema(
  {
    originalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    contact: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "client", "delivery"],
      required: true,
    },

    deletedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Bin || mongoose.model("Bin", binSchema);