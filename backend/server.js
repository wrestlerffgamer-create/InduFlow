const express = require("express");
const cors = require("cors");
const pool = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const authMiddleware = require("./src/middleware/authMiddleware");
const roleMiddleware = require("./src/middleware/roleMiddleware");
const orderRoutes = require("./src/routes/orderRoutes");
const stageRoutes = require("./src/routes/stageRoutes");
const delayService = require("./src/services/delayService");
const notificationRoutes = require("./src/routes/notificationRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const userRoutes = require("./src/routes/userRoutes");
const workerRoutes = require("./src/routes/workerRoutes");
const headRoutes = require("./src/routes/headRoutes");
const requestRoutes = require("./src/routes/requestRoutes");
require("dotenv").config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());


app.get("/", (_req, res) => {
  res.json({ name: "FlowForge API", status: "ok" });
});


app.use("/api/auth", authRoutes);


app.use("/api/orders", orderRoutes);


app.use("/api/stages", stageRoutes);


app.post("/api/check-delays", authMiddleware, roleMiddleware("admin"), async (_req, res) => {
  try {
    await delayService.checkDelays();
    res.send("Delay check completed");
  } catch (err) {
    res.status(500).send("Error checking delays");
  }
});


app.use("/api/notifications", notificationRoutes);


app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/head", headRoutes);
app.use("/api/requests", requestRoutes);

let delayCheckRunning = false;
const checkDelays = async () => {
  if (delayCheckRunning) return;
  delayCheckRunning = true;
  try {
    await delayService.checkDelays();
  } catch (error) {
    console.error("Scheduled delay check failed:", error.message);
  } finally {
    delayCheckRunning = false;
  }
};
setInterval(checkDelays, Number(process.env.DELAY_CHECK_INTERVAL_MS) || 300000).unref();

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Unexpected server error" });
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  checkDelays();
});
