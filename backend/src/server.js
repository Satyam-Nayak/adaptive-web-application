const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/database");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test backend route
app.get("/", (req, res) => {
  res.json({
    message: "Adaptive Web Application Backend is running",
  });
});

// Test database connection
app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");

    res.json({
      success: true,
      message: "MySQL connection successful",
      data: rows,
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(500).json({
      success: false,
      message: "MySQL connection failed",
      error: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});