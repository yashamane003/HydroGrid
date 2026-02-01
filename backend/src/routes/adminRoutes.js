const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getAnalytics,
  getUsers,
  getUserDetails,
  deleteDevice,
} = require("../controllers/adminController");

// All routes are protected and require admin role
router.get("/analytics", protect, admin, getAnalytics);
router.get("/users", protect, admin, getUsers);
router.get("/users/:id", protect, admin, getUserDetails);
router.delete("/devices/:id", protect, admin, deleteDevice);

module.exports = router;
