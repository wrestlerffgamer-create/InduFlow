const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const userController = require("../controllers/userController");

const router = express.Router();
router.use(authMiddleware);
router.get("/departments", userController.listDepartments);
router.get("/", roleMiddleware("admin"), userController.listUsers);
router.post("/", roleMiddleware("admin"), userController.createUser);
router.patch("/:id/active", roleMiddleware("admin"), userController.setActive);
module.exports = router;
