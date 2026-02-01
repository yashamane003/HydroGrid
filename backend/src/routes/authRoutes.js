const express = require("express");
const router = express.Router();
const { authUser, registerUser, setupAdmin } = require("../controllers/authController");

router.post("/login", authUser);
router.post("/register", registerUser);
router.get("/setup-admin", setupAdmin);

module.exports = router;
