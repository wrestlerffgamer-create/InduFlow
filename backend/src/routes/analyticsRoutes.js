const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/dashboard", authMiddleware, roleMiddleware("ceo", "design_head", "production_head", "quality_head", "dispatch_head"), analyticsController.getDashboard);

module.exports = router;
