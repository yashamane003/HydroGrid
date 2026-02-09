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
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Plant", plantSchema);
