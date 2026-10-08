const pool = require("../config/db");
const notificationService = require("./notificationService");

exports.checkDelays = async () => {
  const result = await pool.query(
    `SELECT * FROM workflow_stages
     WHERE status = 'in_progress'
       AND started_at + (expected_duration * INTERVAL '1 hour') < NOW()`
  );

  for (const stage of result.rows) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `UPDATE workflow_stages
         SET status = 'delayed'
         WHERE id = $1 AND status = 'in_progress'
         RETURNING id`,
        [stage.id]
      );
      if (!updated.rows.length) {
        await client.query("ROLLBACK");
        continue;
      }
      await client.query(
        `INSERT INTO logs (order_id, message)
         VALUES ($1, $2)`,
        [
          stage.order_id,
          `Department ${stage.department_id} delayed`
        ]
      );
      await notificationService.createNotificationForDepartment(
        stage.department_id,
        `Your department is delayed on order #${stage.order_id}.`,
        client
      );
      await client.query("UPDATE orders SET status = 'delayed' WHERE id = $1 AND status <> 'completed'", [stage.order_id]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
};
