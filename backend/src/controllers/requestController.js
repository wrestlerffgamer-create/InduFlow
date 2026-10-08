const pool = require("../config/db");
const notificationService = require("../services/notificationService");

exports.createRequest = async (req, res) => {
  const { request_type, worker_name, worker_email, target_user_id, reason } = req.body;
  if (!['add_worker', 'remove_worker'].includes(request_type) || !reason?.trim()) {
    return res.status(400).json({ message: "A valid request type and reason are required" });
  }
  if (request_type === 'add_worker' && (!worker_name?.trim() || !worker_email?.trim())) {
    return res.status(400).json({ message: "Name and email are required for an add-worker request" });
  }
  if (request_type === 'remove_worker' && !target_user_id) {
    return res.status(400).json({ message: "Select a worker to remove" });
  }
  const result = await pool.query(
    `INSERT INTO staff_requests (department_id, requested_by, request_type, worker_name, worker_email, target_user_id, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.departmentId, req.user.id, request_type, worker_name?.trim() || null,
      worker_email?.trim().toLowerCase() || null, target_user_id || null, reason.trim()]
  );
  res.status(201).json(result.rows[0]);
};

exports.listRequests = async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const result = await pool.query(
    `SELECT sr.*, d.name AS department_name, u.name AS requester_name, target.name AS target_user_name
     FROM staff_requests sr
     JOIN departments d ON d.id = sr.department_id
     JOIN users u ON u.id = sr.requested_by
     LEFT JOIN users target ON target.id = sr.target_user_id
     ${isAdmin ? '' : 'WHERE sr.department_id = $1'}
     ORDER BY sr.created_at DESC`,
    isAdmin ? [] : [req.user.departmentId]
  );
  res.json(result.rows);
};

exports.reviewRequest = async (req, res) => {
  const status = req.body.status;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: "Invalid review status" });
  const result = await pool.query(
    `UPDATE staff_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW()
     WHERE id = $3 AND status = 'pending' RETURNING *`,
    [status, req.user.id, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ message: "Pending request not found" });
  const request = result.rows[0];
  await notificationService.createNotificationForUser(request.requested_by, `Your staffing request was ${status}.`);
  res.json(request);
};
