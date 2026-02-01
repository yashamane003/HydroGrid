const express = require("express");
const router = express.Router();
const {
  authDevice,
  heartbeat,
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

// User Management Routes
router.route("/").post(protect, registerDevice).get(protect, getMyDevices);
router.post("/claim", protect, claimDevice);

router.get("/:id/telemetry", protect, getLatestTelemetry);
router.get("/:id/telemetry/history", protect, getHistory);
router.post("/:id/telemetry", protectDevice, ingestTelemetry);
router.post("/:id/commands", protect, sendCommand);

module.exports = router;
