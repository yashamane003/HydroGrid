const express = require("express");
const router = express.Router();
const {
  authUser,
  registerUser,
  setupAdmin,
  logoutUser,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/login", authUser);
router.post("/logout", protect, logoutUser);
router.post("/register", registerUser);
router.get("/setup-admin", setupAdmin);

module.exports = router;
