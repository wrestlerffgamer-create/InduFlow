const pool = require("../config/db");

exports.createNotificationForDepartment = async (departmentId, message, client = pool) => {
  await client.query(
    `INSERT INTO notifications (user_id, message)
     SELECT id, $2 FROM users WHERE department_id = $1 AND is_active = TRUE`,
    [departmentId, message]
  );
};

exports.createNotificationForUser = (userId, message, client = pool) => client.query(
  "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
  [userId, message]
);
