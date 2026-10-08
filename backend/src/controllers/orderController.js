const pool = require("../config/db");
const workflowService = require("../services/workflowService");
const notificationService = require("../services/notificationService");

// Create Order
exports.createOrder = async (req, res) => {
  const { title, description = "", durations } = req.body;

  if (
    !durations ||
    durations.design == null ||
    durations.production == null ||
    durations.quality == null ||
    durations.dispatch == null
  ) {
    return res.status(400).json({
      message: "All department durations are required",
    });
  }

  if (!title?.trim()) return res.status(400).json({ message: "An order title is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO orders (title, description, status, durations) VALUES ($1,$2,$3,$4) RETURNING *",
      [title.trim(), description.trim(), "in_progress", durations]
    );

    const order = result.rows[0];

    // Pass durations
    await workflowService.initializeWorkflow(order.id, durations, client);
    await client.query(
      "INSERT INTO logs (order_id, actor_id, message) VALUES ($1, $2, $3)",
      [order.id, req.user.id, "Order created; Design stage started"]
    );
    await notificationService.createNotificationForDepartment(
      1,
      `A new order (#${order.id}) is ready for the Design department.`,
      client
    );
    await client.query("COMMIT");

    res.status(201).json(order);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ message: err.message || "Error creating order" });
  } finally {
    client.release();
  }
};

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const params = [];
    let query = "SELECT * FROM orders";
    if (req.user.role.endsWith("_head")) {
      query += " WHERE id IN (SELECT order_id FROM workflow_stages WHERE department_id = $1)";
      params.push(req.user.departmentId);
    }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error fetching orders");
  }
};
