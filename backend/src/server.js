const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorMiddleware");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const startBroker = require("./services/mqttBroker");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Connect to Database
connectDB();

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Middleware (Order Matters)
app.use(express.json()); // 1. Parse JSON first
app.use(cors()); // 2. CORS

// ESP Routes (Bypass Rate Limit & Helper)
const espRoutes = require("./routes/espRoutes");
app.use("/api/esp", espRoutes);

// Security Headers (Helmet)
app.use(helmet());

// Rate Limiting (100 requests per 10 minutes)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 1000, // Increased limit for development
});
app.use(limiter); // Applied to routes defined below

// Routes
const authRoutes = require("./routes/authRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/users", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/admin", adminRoutes);
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use(errorHandler);

// Start MQTT Broker
startBroker();

// Start Server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
