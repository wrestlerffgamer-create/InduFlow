const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const workerController = require("../controllers/workerController");

router.use(authMiddleware);
router.get("/my-work", roleMiddleware("worker"), workerController.getMyWork);
router.post("/my-progress", roleMiddleware("worker"), workerController.completeMyWork);

module.exports = router;
