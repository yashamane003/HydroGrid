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
  deleteDevice,
  updateAutomation,
} = require("../controllers/deviceManagementController");
const {
  ingestTelemetry,
  getLatestTelemetry,
  getHistory,
} = require("../controllers/telemetryController");
const { provisionDevice } = require("../controllers/provisionController");
const {
  sendCommand,
  motorInOn,
  motorInOff,
  motorOutOn,
  motorOutOff,
  motorPhUpOn,
  motorPhUpOff,
  motorPhDownOn,
  motorPhDownOff,
  motorNutrientAOn,
  motorNutrientAOff,
  motorNutrientBOn,
  motorNutrientBOff,
  startControl,
} = require("../controllers/commandController");
const { protect } = require("../middleware/authMiddleware");
const { protectDevice } = require("../middleware/deviceAuthMiddleware");

// Device Auth & Provisioning
router.post("/auth", authDevice);
router.post("/provision", provisionDevice);
router.post("/heartbeat", protectDevice, heartbeat);
router.get("/status", getDeviceStatus);
router.post("/pair/init", initPairing);

// User Management Routes
router.route("/").post(protect, registerDevice).get(protect, getMyDevices);
router.post("/claim", protect, claimDevice);
router.delete("/:id", protect, deleteDevice);

router.get("/:id/telemetry", protect, getLatestTelemetry);
router.get("/:id/telemetry/history", protect, getHistory);
router.post("/:id/telemetry", protectDevice, ingestTelemetry);
router.post("/:id/commands", protect, sendCommand);
router.post("/:id/motor/in/on", protect, motorInOn);
router.post("/:id/motor/in/off", protect, motorInOff);
router.post("/:id/motor/out/on", protect, motorOutOn);
router.post("/:id/motor/out/off", protect, motorOutOff);
router.post("/:id/motor/phup/on", protect, motorPhUpOn);
router.post("/:id/motor/phup/off", protect, motorPhUpOff);
router.post("/:id/motor/phdown/on", protect, motorPhDownOn);
router.post("/:id/motor/phdown/off", protect, motorPhDownOff);
router.post("/:id/motor/nutrienta/on", protect, motorNutrientAOn);
router.post("/:id/motor/nutrienta/off", protect, motorNutrientAOff);
router.post("/:id/motor/nutrientb/on", protect, motorNutrientBOn);
router.post("/:id/motor/nutrientb/off", protect, motorNutrientBOff);
router.post("/:id/start-control", protect, startControl);
router.put("/:id/automation", protect, updateAutomation);

module.exports = router;
