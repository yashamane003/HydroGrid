const mongoose = require("mongoose");

const plantSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    targetTds: {
      type: Number,
      required: true,
    },
    targetPh: {
      type: Number,
      required: true,
    },
    targetTemp: {
      type: Number,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    usage: {
      type: String,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Plant", plantSchema);
