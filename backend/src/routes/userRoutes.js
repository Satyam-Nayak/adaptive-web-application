const express = require("express");

const {
  getUsers,
  getProfile,
} = require("../controllers/userController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getUsers);

router.get(
  "/profile",
  authenticateToken,
  getProfile
);

module.exports = router;