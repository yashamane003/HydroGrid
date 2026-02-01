const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorMiddleware");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const startBroker = require("./services/mqttBroker");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Connect to Database
connectDB();

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Middleware
app.use(helmet()); // Secure Headers
app.use(cors());
app.use(express.json());

// Rate Limiting (100 requests per 10 minutes)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});
app.use(limiter);

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
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
