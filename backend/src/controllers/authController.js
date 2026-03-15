const User = require("../models/userModel");
const Company = require("../models/companyModel");
const Device = require("../models/deviceModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    user.lastLogin = Date.now();
    user.status = "active";
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public/Admin (depending on strategy, allowing public register for now)
const registerUser = async (req, res) => {
  const { name, email, password, role, espId } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const company = await Company.create({
    name: `${name}'s Farm`,
  });

  const user = await User.create({
    name,
    email,
    password,
    role: role || "user", // Default to user if not provided
    company: company._id,
  });

  let deviceSecretPlain = null;
  if (company && user) {
    company.users.push(user._id);

    // If ESP ID provided, create device
    if (espId) {
      const secret = crypto.randomBytes(16).toString("hex");
      const salt = await bcrypt.genSalt(10);
      const hashedSecret = await bcrypt.hash(secret, salt);

      const device = await Device.create({
        name: "My First Device",
        deviceId: espId,
        deviceSecret: hashedSecret,
        company: company._id,
        status: "offline",
      });

      if (device) {
        company.devices.push(device._id);
        deviceSecretPlain = secret;
      }
    }

    await company.save();
  }

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      deviceSecret: deviceSecretPlain, // Return secret if created
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// @desc    Setup/Reset System Admin
// @route   GET /api/users/setup-admin
// @access  Public (dev only - normally secure this)
const setupAdmin = async (req, res) => {
  const adminEmail = "admin@example.com";
  let user = await User.findOne({ email: adminEmail });

  let company = await Company.findOne({ name: "Admin Farm" });
  if (!company) {
    company = await Company.create({ name: "Admin Farm" });
  }

  if (user) {
    user.role = "admin";
    user.name = "System Admin";
    user.company = company._id;
    if (!user.lastLogin) user.lastLogin = Date.now();
    await user.save();

    if (!company.users.includes(user._id)) {
      company.users.push(user._id);
      await company.save();
    }

    res.json({
      message: "Existing user updated to Admin role.",
      email: adminEmail,
    });
  } else {
    user = await User.create({
      name: "System Admin",
      email: adminEmail,
      password: "password123",
      role: "admin",
      company: company._id,
      lastLogin: Date.now(),
    });

    company.users.push(user._id);
    await company.save();

    res.json({
      message: "Admin user created.",
      email: adminEmail,
      password: "password123",
    });
  }
};

// @desc    Logout user & clear status
// @route   POST /api/users/logout
// @access  Private
const logoutUser = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.status = "inactive";
    await user.save();
    res.json({ message: "Logged out successfully" });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

module.exports = { authUser, registerUser, setupAdmin, logoutUser };
