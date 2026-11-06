
const express = require("express");

const {
  recordEvent,
  getEvents,
} = require("../controllers/behaviourController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Record a behaviour event
router.post("/events", authenticateToken, recordEvent);

// Retrieve the authenticated user's events
router.get("/events", authenticateToken, getEvents);

module.exports = router;
