const express = require("express");
const router = express.Router();
const {
  getPlants,
  addPlant,
  deletePlant,
  updatePlant,
} = require("../controllers/plantController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getPlants).post(protect, addPlant);
router.route("/:id").delete(protect, deletePlant).put(protect, updatePlant);

module.exports = router;
