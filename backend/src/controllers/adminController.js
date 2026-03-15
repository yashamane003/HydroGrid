const User = require("../models/userModel");
const Device = require("../models/deviceModel");
const Plant = require("../models/plantModel");
const DeviceTelemetry = require("../models/telemetryModel");

// @desc    Get admin analytics stats
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // Live Users: Logged in within last 60 minutes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const liveUsers = await User.countDocuments({
      lastLogin: { $gte: oneHourAgo },
      role: { $ne: "admin" }, // Fix: Exclude admins
    });

    // Dynamic Period Graph
    const period = req.query.period || "7d";
    let matchStage = { role: { $ne: "admin" } };
    let groupByFormat = "%Y-%m-%d";
    let dateFilter = new Date();
    let stats = [];

    if (period === "12m") {
      dateFilter.setMonth(dateFilter.getMonth() - 12);
      groupByFormat = "%Y-%m";
    } else if (period === "5y") {
      dateFilter.setFullYear(dateFilter.getFullYear() - 5);
      groupByFormat = "%Y";
    } else {
      // Default 7d
      dateFilter.setDate(dateFilter.getDate() - 7);
    }

    matchStage.createdAt = { $gte: dateFilter };

    const rawStats = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill gaps logic would be complex for generic periods,
    // for now we send rawStats formatted.
    // Ideally we'd fill 0s for missing months/years.

    // Fill gaps and format labels
    stats = rawStats.map((item) => {
      let label = item._id;
      const dateObj = new Date(item._id); // Assuming simplified date strings work or append T00:00

      if (period === "7d" || period === "1m") {
        // For days: Show "Mon 12" or just "Mon"
        label = dateObj.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
        });
      } else if (period === "12m" || period === "6m") {
        // For months: Show "Jan 24"
        // Append day to make it parseable if just YYYY-MM
        const d = new Date(item._id + "-02");
        label = d.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
      } else if (period === "5y") {
        // Year is already just YYYY
        label = item._id;
      }

      return {
        name: label,
        users: item.count,
      };
    });

    // Total Users (Excluding Admins)
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

    // Total Devices
    const totalDevices = await Device.countDocuments({});

    // Count users using system plants
    const systemPlants = await Plant.find({ isSystem: true }).select("_id");
    const systemPlantIds = systemPlants.map((p) => p._id);

    // Find unique user IDs from devices that reference these system plants
    const systemPlantUsers = await Device.distinct("userId", {
      selectedPlant: { $in: systemPlantIds },
    });

    const systemPlantUserCount = systemPlantUsers.length;

    res.json({
      liveUsers,
      registeredUsers: totalUsers,
      totalDevices,
      systemPlantUsers: systemPlantUserCount,
      graphData: stats,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to fetch analytics");
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password") // Exclude password
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500);
    throw new Error("Failed to fetch users");
  }
};

// @desc    Get specific user details and activity
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("company");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Fetch User's Devices and populate selected plant
    let devices = [];
    if (user.company) {
      devices = await Device.find({ company: user.company._id }).populate(
        "selectedPlant",
      );
    }

    // Fetch User's (Company's) Plants
    let plants = [];
    if (user.company) {
      plants = await Plant.find({ company: user.company._id });
    }

    // Real Activity Data (Last 7 Days Telemetry Count)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get device IDs belonging to this user's company
    const deviceIds = devices.map((d) => d._id);

    const rawActivity = await DeviceTelemetry.aggregate([
      {
        $match: {
          device: { $in: deviceIds },
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    // Fill last 7 days
    const activity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      const found = rawActivity.find((a) => a._id === dateStr);
      activity.push({
        date: dateStr,
        day: dayName,
        usage: found ? found.count : 0,
      });
    }

    res.json({
      user,
      devices,
      plants,
      activity,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500);
    throw new Error("Failed to fetch user details");
  }
};

// @desc    Delete device
// @route   DELETE /api/admin/devices/:id
// @access  Private/Admin
const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      res.status(404);
      throw new Error("Device not found");
    }

    // Remove from company
    const Company = require("../models/companyModel");
    await Company.updateOne(
      { _id: device.company },
      { $pull: { devices: device._id } },
    );

    // Delete device
    await device.deleteOne();

    res.json({ message: "Device removed" });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to delete device");
  }
};

module.exports = {
  getAnalytics,
  getUsers,
  getUserDetails,
  deleteDevice,
};
