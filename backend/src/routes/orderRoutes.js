const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);
router.post("/", roleMiddleware("admin"), orderController.createOrder);
router.get("/", roleMiddleware("admin", "ceo", "design_head", "production_head", "quality_head", "dispatch_head"), orderController.getOrders);

module.exports = router;
