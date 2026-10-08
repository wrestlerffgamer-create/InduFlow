const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const workerController = require("../controllers/workerController");
const requestController = require("../controllers/requestController");

const router = express.Router();
router.use(authMiddleware, roleMiddleware("design_head", "production_head", "quality_head", "dispatch_head"));
router.get("/feedback", workerController.listFeedback);
router.get("/workers", workerController.listDepartmentWorkers);
router.get("/requests", requestController.listRequests);
router.post("/requests", requestController.createRequest);
module.exports = router;
