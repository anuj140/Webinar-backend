const express = require("express");
const router = express.Router();
const { authenticateAdmin } = require("../middleware/authentication");
const {
  login,
  getProfile,
  createAdmin,
  updateProfile,
  changePassword,
} = require("../controllers/adminController");

// Public routes
router.post("/login", login);
router.post("/create", createAdmin); // For initial setup

// Protected routes
router.get("/profile", authenticateAdmin, getProfile);
router.put("/profile", authenticateAdmin, updateProfile);
router.put("/password", authenticateAdmin, changePassword);

module.exports = router;
