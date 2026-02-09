const Plant = require("../models/plantModel");

const DEFAULT_PLANTS = [
  {
    name: "Lettuce (Butterhead)",
    targetTds: 600,
    targetPh: 6.0,
    targetTemp: 20,
  },
  { name: "Basil (Genovese)", targetTds: 800, targetPh: 6.2, targetTemp: 22 },
  { name: "Tomato (Cherry)", targetTds: 1500, targetPh: 6.5, targetTemp: 24 },
  { name: "Spinach", targetTds: 1200, targetPh: 6.0, targetTemp: 18 },
  { name: "Strawberry", targetTds: 900, targetPh: 5.8, targetTemp: 21 },
  { name: "Kale (Curly)", targetTds: 1100, targetPh: 6.3, targetTemp: 19 },
  { name: "Peppers (Bell)", targetTds: 1400, targetPh: 6.2, targetTemp: 25 },
  { name: "Mint (Peppermint)", targetTds: 700, targetPh: 6.5, targetTemp: 21 },
  { name: "Cucumber", targetTds: 1300, targetPh: 6.0, targetTemp: 23 },
  { name: "Coriander", targetTds: 750, targetPh: 6.5, targetTemp: 20 },
];

// @desc    Get all plants for the company (seeds defaults if empty)
// @route   GET /api/plants
// @access  Private
const getPlants = async (req, res) => {
  try {
    if (!req.user.company) {
      return res
        .status(400)
        .json({
          message:
            "User is not associated with a company. Please contact your administrator.",
        });
    }

    let plants = await Plant.find({ company: req.user.company });

    if (plants.length === 0) {
      const seededPlants = DEFAULT_PLANTS.map((p) => ({
        ...p,
        company: req.user.company,
        user: req.user._id,
      }));
      await Plant.insertMany(seededPlants);
      plants = await Plant.find({ company: req.user.company });
    }

    res.json(plants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new plant
// @route   POST /api/plants
// @access  Private
const addPlant = async (req, res) => {
  try {
    if (!req.user.company) {
      return res
        .status(400)
        .json({ message: "User is not associated with a company." });
    }

    const { name, targetTds, targetPh, targetTemp } = req.body;

    if (
      !name ||
      targetTds === undefined ||
      targetPh === undefined ||
      targetTemp === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all plant fields" });
    }

    const plant = await Plant.create({
      name,
      targetTds,
      targetPh,
      targetTemp,
      company: req.user.company,
      user: req.user._id,
    });

    if (plant) {
      res.status(201).json(plant);
    } else {
      res.status(400).json({ message: "Invalid plant data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a plant
// @route   DELETE /api/plants/:id
// @access  Private
const deletePlant = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }

    // Check if plant belongs to the user's company
    if (plant.company.toString() !== req.user.company?.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this plant" });
    }

    await plant.deleteOne();
    res.json({ message: "Plant removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a plant
// @route   PUT /api/plants/:id
// @access  Private
const updatePlant = async (req, res) => {
  try {
    const { name, targetTds, targetPh, targetTemp } = req.body;

    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }

    // Check if plant belongs to the user's company
    if (plant.company.toString() !== req.user.company?.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this plant" });
    }

    plant.name = name || plant.name;
    plant.targetTds = targetTds !== undefined ? targetTds : plant.targetTds;
    plant.targetPh = targetPh !== undefined ? targetPh : plant.targetPh;
    plant.targetTemp = targetTemp !== undefined ? targetTemp : plant.targetTemp;

    const updatedPlant = await plant.save();
    res.json(updatedPlant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPlants, addPlant, deletePlant, updatePlant };
