// server/routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const { verifyToken } = require("../middleware/authMiddleware");

// Student must be logged in
router.get("/menu", verifyToken, studentController.getMenu);
router.post("/book", verifyToken, studentController.bookItem);
router.post("/cancel", verifyToken, studentController.cancelBooking);
router.get("/history", verifyToken, studentController.getHistory);

module.exports = router;
