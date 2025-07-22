// server/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

// All routes protected for admin only
router.post("/addItem", authMiddleware.verifyToken, authMiddleware.isAdmin, adminController.addFoodItem);
router.get("/todaySummary", authMiddleware.verifyToken, authMiddleware.isAdmin, adminController.viewTodaySummary);
router.get("/todayDetails", authMiddleware.verifyToken, authMiddleware.isAdmin, adminController.viewTodayDetails);
router.get("/salesHistory", authMiddleware.verifyToken, authMiddleware.isAdmin, adminController.viewSalesHistory);

module.exports = router;
