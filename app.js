require("dotenv").config();
require("express-async-errors");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { StatusCodes } = require("http-status-codes");

// Import routes and middleware
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const connectDB = require("./db/connect");
const errorHandler = require("./middleware/error-middleware");

const app = express();

// Middleware
app.use(
  cors({
    origin: "https://landingpageaayakar.netlify.app/",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(StatusCodes.OK).json({
    status: "OK",
    message: "Webinar API is running",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(StatusCodes.OK).json({
    message: "Webinar Backend API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      admin: "/api/admin",
      health: "/health",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
