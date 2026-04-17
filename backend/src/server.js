const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { initializeDatabase } = require("./config/database");
const reportRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeDatabase().catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "CleanReport API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", reportRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to CleanReport API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      createReport: "POST /api/report",
      getAllReports: "GET /api/reports",
      getReportById: "GET /api/report/:id",
      updateReportStatus: "PUT /api/report/:id",
      deleteReport: "DELETE /api/report/:id",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ CleanReport API is running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
