const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const requestController = require("../controllers/requestController");

const router = express.Router();
router.use(authMiddleware, roleMiddleware("admin"));
router.get("/", requestController.listRequests);
router.patch("/:id", requestController.reviewRequest);
module.exports = router;
