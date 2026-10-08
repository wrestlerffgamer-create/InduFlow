const pool = require("../config/db");
const { STAGES } = require("../config/workflow");

exports.initializeWorkflow = async (orderId, durations, client = pool) => {
  for (const stage of STAGES) {
    const duration = Number(durations[stage.key]);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error(`A positive ${stage.key} duration is required`);
    }
    await client.query(
      `INSERT INTO workflow_stages 
      (order_id, department_id, stage_position, status, expected_duration, started_at)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        orderId,
        stage.departmentId,
        stage.position,
        stage.position === 1 ? "in_progress" : "pending",
        duration,
        stage.position === 1 ? new Date() : null,
      ]
    );
  }
};

exports.createProgressRows = async (workflowStageId, departmentId, client = pool) => {
  await client.query(
    `INSERT INTO stage_progress (workflow_stage_id, user_id)
     SELECT $1, id FROM users
     WHERE department_id = $2 AND role = 'worker' AND is_active = TRUE
     ON CONFLICT (workflow_stage_id, user_id) DO NOTHING`,
    [workflowStageId, departmentId]
  );
};
