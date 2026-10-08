const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (Number(userId) !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "You can only view your own notifications" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error fetching notifications");
  }
});

router.patch("/:notificationId/read", async (req, res) => {
  const result = await pool.query(
    "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *",
    [req.params.notificationId, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ message: "Notification not found" });
  res.json(result.rows[0]);
});

module.exports = router;
