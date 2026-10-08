const pool = require("../config/db");

// 1. Order stats
exports.getOrderStats = async (departmentId) => {
  const result = await pool.query(`
    SELECT o.status, COUNT(*)::int
    FROM orders o
    ${departmentId ? "JOIN workflow_stages ws ON ws.order_id = o.id" : ""}
    ${departmentId ? "WHERE ws.department_id = $1" : ""}
    GROUP BY o.status
  `, departmentId ? [departmentId] : []);
  return result.rows;
};

// 2. Delays per department
exports.getDelaysByDept = async (departmentId) => {
  const result = await pool.query(`
    SELECT department_id, COUNT(*)::int
    FROM workflow_stages
    WHERE status = 'delayed'
    ${departmentId ? "AND department_id = $1" : ""}
    GROUP BY department_id
  `, departmentId ? [departmentId] : []);
  return result.rows;
};

// 3. Active vs completed
exports.getWorkflowStats = async (departmentId) => {
  const result = await pool.query(`
    SELECT status, COUNT(*)::int
    FROM workflow_stages
    ${departmentId ? "WHERE department_id = $1" : ""}
    GROUP BY status
  `, departmentId ? [departmentId] : []);
  return result.rows;
};

exports.getOrderProgress = async (departmentId) => {
  const result = await pool.query(
    `SELECT o.id, o.title, o.status, o.created_at,
       COALESCE(json_agg(json_build_object(
         'departmentId', ws.department_id, 'status', ws.status,
         'position', ws.stage_position, 'expectedDuration', ws.expected_duration
       ) ORDER BY ws.stage_position) FILTER (WHERE ws.id IS NOT NULL), '[]') AS stages
     FROM orders o
     JOIN workflow_stages ws ON ws.order_id = o.id
     ${departmentId ? "WHERE ws.department_id = $1" : ""}
     GROUP BY o.id ORDER BY o.created_at DESC`,
    departmentId ? [departmentId] : []
  );
  return result.rows;
};
