const pool = require("../config/db");
const stageService = require("../services/stageService");

exports.getMyWork = async (req, res) => {
  const result = await pool.query(
    `SELECT o.id AS order_id, o.title, o.description, ws.id AS stage_id, ws.status,
       ws.expected_duration, ws.started_at, sp.status AS my_status,
       (SELECT COUNT(*)::int FROM stage_progress p WHERE p.workflow_stage_id = ws.id AND p.status = 'completed') AS completed_workers,
       (SELECT COUNT(*)::int FROM stage_progress p WHERE p.workflow_stage_id = ws.id) AS total_workers
     FROM workflow_stages ws
     JOIN orders o ON o.id = ws.order_id
     LEFT JOIN stage_progress sp ON sp.workflow_stage_id = ws.id AND sp.user_id = $1
     WHERE ws.department_id = $2 AND ws.status IN ('in_progress', 'delayed')
     ORDER BY o.created_at DESC`,
    [req.user.id, req.user.departmentId]
  );
  res.json(result.rows);
};

exports.completeMyWork = async (req, res) => {
  try {
    const result = await stageService.markWorkerComplete(Number(req.body.orderId), req.user);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  const result = await pool.query(
    `INSERT INTO attendance (user_id) VALUES ($1)
     ON CONFLICT (user_id, attendance_date) DO NOTHING RETURNING *`,
    [req.user.id]
  );
  res.status(result.rows[0] ? 201 : 200).json({ marked: true, alreadyMarked: !result.rows[0] });
};

exports.createFeedback = async (req, res) => {
  const { type, message } = req.body;
  if (!['suggestion', 'grievance'].includes(type) || !message?.trim()) {
    return res.status(400).json({ message: "A feedback type and message are required" });
  }
  const result = await pool.query(
    `INSERT INTO feedback (user_id, department_id, type, message) VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.id, req.user.departmentId, type, message.trim()]
  );
  res.status(201).json(result.rows[0]);
};

exports.listFeedback = async (req, res) => {
  const result = await pool.query(
    `SELECT f.*, u.name AS author_name FROM feedback f JOIN users u ON u.id = f.user_id
     WHERE f.department_id = $1 ORDER BY f.created_at DESC`,
    [req.user.departmentId]
  );
  res.json(result.rows);
};

exports.listDepartmentWorkers = async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email FROM users
     WHERE department_id = $1 AND role = 'worker' AND is_active = TRUE ORDER BY name`,
    [req.user.departmentId]
  );
  res.json(result.rows);
};
