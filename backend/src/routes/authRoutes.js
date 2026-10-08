const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.me);
router.post("/register", authMiddleware, roleMiddleware("admin"), authController.register);

module.exports = router;
