const express = require("express");
const router = express.Router();
const { authenticateAdmin } = require("../middleware/authentication");
const {
  registerUser,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  deleteMultipleUsers,
  getStats,
} = require("../controllers/userController");

// Public routes
router.post("/register", registerUser);
// router.get("/public-stats", getPublicStats);

// Admin protected routes
router.get("/", authenticateAdmin, getAllUsers);
router.get("/stats", authenticateAdmin, getStats);
router.get("/:id", authenticateAdmin, getUserById);
router.put("/:id/status", authenticateAdmin, updateUserStatus);
router.delete("/:id", authenticateAdmin, deleteUser);
router.delete("/", authenticateAdmin, deleteMultipleUsers);

module.exports = router;
