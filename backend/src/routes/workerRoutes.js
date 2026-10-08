const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const workerController = require("../controllers/workerController");

const router = express.Router();
router.use(authMiddleware, roleMiddleware("worker"));
router.post("/attendance", workerController.markAttendance);
router.post("/feedback", workerController.createFeedback);
module.exports = router;
