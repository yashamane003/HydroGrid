const express = require("express");
const router = express.Router();
const {
  authDevice,
  heartbeat,
  getDeviceStatus,
  initPairing,
} = require("../controllers/deviceAuthController");
const {
  registerDevice,
  getMyDevices,
  claimDevice,
} = require("../controllers/deviceManagementController");
const {
  ingestTelemetry,
  getLatestTelemetry,
  getHistory,
} = require("../controllers/telemetryController");
const { provisionDevice } = require("../controllers/provisionController");
const { sendCommand } = require("../controllers/commandController");
const { protect } = require("../middleware/authMiddleware");
const { protectDevice } = require("../middleware/deviceAuthMiddleware");

// Device Auth & Provisioning
router.post("/auth", authDevice);
router.post("/provision", provisionDevice);
router.post("/heartbeat", protectDevice, heartbeat);
router.get("/status", getDeviceStatus);
router.post("/pair/init", initPairing); // Fix 404 pairing error // Polling Endpoint for Provisioning

// User Management Routes
router.route("/").post(protect, registerDevice).get(protect, getMyDevices);
router.post("/claim", protect, claimDevice);
router.delete(
  "/:id",
  protect,
  require("../controllers/deviceManagementController").deleteDevice,
);

router.get("/:id/telemetry", protect, getLatestTelemetry);
router.get("/:id/telemetry/history", protect, getHistory);
router.post("/:id/telemetry", protectDevice, ingestTelemetry);
router.post("/:id/commands", protect, sendCommand);

module.exports = router;
