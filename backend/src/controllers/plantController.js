const Plant = require("../models/plantModel");
const Device = require("../models/deviceModel");

const DEFAULT_PLANTS = [
  {
    name: "Lettuce (Butterhead)",
    targetTds: 600,
    targetPh: 6.0,
    targetTemp: 20,
    usage: "Best for crispy salads and fresh sandwiches.",
    isSystem: true,
  },
  {
    name: "Basil (Genovese)",
    targetTds: 800,
    targetPh: 6.2,
    targetTemp: 22,
    usage: "Ideal for fresh pesto, pasta dishes, and herbal infusions.",
    isSystem: true,
  },
  {
    name: "Tomato (Cherry)",
    targetTds: 1500,
    targetPh: 6.5,
    targetTemp: 24,
    usage: "Sweet berries perfect for snacks, salads, and culinary garnishes.",
    isSystem: true,
  },
  {
    name: "Spinach",
    targetTds: 1200,
    targetPh: 6.0,
    targetTemp: 18,
    usage: "Nutrient-dense greens for smoothies, salads, and cooking.",
    isSystem: true,
  },
  {
    name: "Strawberry",
    targetTds: 900,
    targetPh: 5.8,
    targetTemp: 21,
    usage: "Delicious fruit for fresh consumption, smoothies, and desserts.",
    isSystem: true,
  },
  {
    name: "Kale (Curly)",
    targetTds: 1100,
    targetPh: 6.3,
    targetTemp: 19,
    usage: "Superfood greens perfect for health shakes and heartier salads.",
    isSystem: true,
  },
  {
    name: "Peppers (Bell)",
    targetTds: 1400,
    targetPh: 6.2,
    targetTemp: 25,
    usage: "Crunchy vegetables for cooking, stuffing, and fresh snacking.",
    isSystem: true,
  },
  {
    name: "Mint (Peppermint)",
    targetTds: 700,
    targetPh: 6.5,
    targetTemp: 21,
    usage: "Refreshing herb for teas, beverages, and garnishing.",
    isSystem: true,
  },
  {
    name: "Cucumber",
    targetTds: 1300,
    targetPh: 6.0,
    targetTemp: 23,
    usage: "Hydrating vegetable for fresh salads and pickles.",
    isSystem: true,
  },
  {
    name: "Coriander",
    targetTds: 750,
    targetPh: 6.5,
    targetTemp: 20,
    usage: "Aromatic herb used extensively for seasoning and garnishing.",
    isSystem: true,
  },
];

// @desc    Get all plants for the company (seeds defaults if empty)
// @route   GET /api/plants
// @access  Private
const getPlants = async (req, res) => {
  try {
    // Seed system plants globally if none exist
    const systemPlantsCount = await Plant.countDocuments({ isSystem: true });
    if (systemPlantsCount === 0) {
      await Plant.insertMany(DEFAULT_PLANTS);
    }

    // All users see system plants. Regular users also see their company-specific plants.
    let filter = {
      $or: [{ company: req.user.company }, { isSystem: true }],
    };

    const plants = await Plant.find(filter).sort({
      isSystem: -1,
      createdAt: -1,
    });

    // Aggregate unique user counts per plant (Admin Only)
    if (req.user.role === "admin") {
      const plantsWithUsage = await Promise.all(
        plants.map(async (p) => {
          const uniqueUsers = await Device.distinct("userId", {
            selectedPlant: p._id,
          });
          return {
            ...p.toObject(),
            userCount: uniqueUsers.length,
          };
        }),
      );
      return res.json(plantsWithUsage);
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
    const { name, targetTds, targetPh, targetTemp, usage, isSystem } = req.body;

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

    // Only admins can create system plants
    const plantIsSystem = isSystem && req.user.role === "admin";

    const plantData = {
      name,
      targetTds,
      targetPh,
      targetTemp,
      usage,
      isSystem: plantIsSystem,
    };

    if (!plantIsSystem) {
      if (!req.user.company) {
        return res
          .status(400)
          .json({ message: "User is not associated with a company." });
      }
      plantData.company = req.user.company;
      plantData.user = req.user._id;
    }

    const plant = await Plant.create(plantData);

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

    if (plant.isSystem) {
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Only admins can delete system templates" });
      }
    } else {
      // Check if plant belongs to the user's company
      if (plant.company?.toString() !== req.user.company?.toString()) {
        return res
          .status(401)
          .json({ message: "Not authorized to delete this plant" });
      }
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
    const { name, targetTds, targetPh, targetTemp, usage, isSystem } = req.body;

    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }

    if (plant.isSystem) {
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Only admins can update system templates" });
      }
    } else {
      // Check if plant belongs to the user's company
      if (plant.company?.toString() !== req.user.company?.toString()) {
        return res
          .status(401)
          .json({ message: "Not authorized to update this plant" });
      }
    }

    plant.name = name || plant.name;
    plant.targetTds = targetTds !== undefined ? targetTds : plant.targetTds;
    plant.targetPh = targetPh !== undefined ? targetPh : plant.targetPh;
    plant.targetTemp = targetTemp !== undefined ? targetTemp : plant.targetTemp;
    plant.usage = usage !== undefined ? usage : plant.usage;

    // Only admins can toggle isSystem
    if (req.user.role === "admin") {
      plant.isSystem = isSystem !== undefined ? isSystem : plant.isSystem;
    }

    const updatedPlant = await plant.save();
    res.json(updatedPlant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPlants, addPlant, deletePlant, updatePlant };
