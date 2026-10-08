const pool = require("../config/db");
const workflowService = require("./workflowService");
const notificationService = require("./notificationService");

exports.markWorkerComplete = async (orderId, user) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const stageResult = await client.query(
      `SELECT ws.*, o.title FROM workflow_stages ws
       JOIN orders o ON o.id = ws.order_id
       WHERE ws.order_id = $1 AND ws.department_id = $2
         AND ws.status IN ('in_progress', 'delayed')
       FOR UPDATE`,
      [orderId, user.departmentId]
    );
    const stage = stageResult.rows[0];
    if (!stage) throw new Error("There is no active stage for your department on this order");

    await workflowService.createProgressRows(stage.id, user.departmentId, client);
    const progress = await client.query(
      `UPDATE stage_progress SET status = 'completed', completed_at = NOW()
       WHERE workflow_stage_id = $1 AND user_id = $2
       RETURNING id`,
      [stage.id, user.id]
    );
    if (!progress.rows.length) throw new Error("You are not an active worker in this department");

    const count = await client.query(
      `SELECT COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
              COUNT(*)::int AS total
       FROM stage_progress sp
       JOIN users u ON u.id = sp.user_id
       WHERE workflow_stage_id = $1 AND u.is_active = TRUE`,
      [stage.id]
    );
    const { completed, total } = count.rows[0];
    let transitioned = false;
    if (total > 0 && completed === total) {
      await completeAndAdvance(stage, user.id, client);
      transitioned = true;
    }
    await client.query("COMMIT");
    return { completed, total, transitioned };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

async function completeAndAdvance(stage, actorId, client) {
  await client.query(
    `UPDATE workflow_stages SET status = 'completed', completed_at = NOW() WHERE id = $1`,
    [stage.id]
  );
  await client.query(
    "INSERT INTO logs (order_id, actor_id, message) VALUES ($1, $2, $3)",
    [stage.order_id, actorId, `Department ${stage.department_id} completed its stage`]
  );
  await notificationService.createNotificationForDepartment(
    stage.department_id,
    `Your department completed its stage for order #${stage.order_id}.`,
    client
  );

  const next = await client.query(
    `UPDATE workflow_stages SET status = 'in_progress', started_at = NOW()
     WHERE order_id = $1 AND stage_position = $2 AND status = 'pending'
     RETURNING id, department_id`,
    [stage.order_id, stage.stage_position + 1]
  );
  if (next.rows[0]) {
    const nextStage = next.rows[0];
    await workflowService.createProgressRows(nextStage.id, nextStage.department_id, client);
    await notificationService.createNotificationForDepartment(
      nextStage.department_id,
      `Your department can now start work on order #${stage.order_id}.`,
      client
    );
    await client.query(
      "UPDATE orders SET status = 'in_progress' WHERE id = $1",
      [stage.order_id]
    );
    return;
  }

  await client.query(
    "UPDATE orders SET status = 'completed', completed_at = NOW() WHERE id = $1",
    [stage.order_id]
  );
}
