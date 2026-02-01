const mongoose = require("mongoose");

const companySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    devices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Company", companySchema);
