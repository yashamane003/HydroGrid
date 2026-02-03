const express = require("express");
const router = express.Router();
const {
  initPairing,
  getDeviceStatus,
} = require("../controllers/deviceAuthController");

// @desc    Initialize pairing (ESP32 calls this)
// @route   POST /api/esp/pair/init
// @access  Public (ESP32)
router.post("/pair/init", initPairing);

router.post("/test", (req, res) => {
  console.log("ESP TEST HIT:", req.body);
  res.status(200).json({ ok: true });
});


// @desc    Check pairing status (ESP32 polls this)
// @route   GET /api/esp/status
// @access  Public (ESP32)
router.get("/status", getDeviceStatus);

module.exports = router;
