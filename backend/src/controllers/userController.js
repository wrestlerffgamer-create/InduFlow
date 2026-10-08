const pool = require("../config/db");
const bcrypt = require("bcrypt");

const publicUserFields = "id, name, email, role, department_id, is_active, created_at";

exports.listUsers = async (_req, res) => {
  const result = await pool.query(
    `SELECT ${publicUserFields} FROM users ORDER BY is_active DESC, name ASC`
  );
  res.json(result.rows);
};

exports.createUser = async (req, res) => {
  const { name, email, password, role, department_id } = req.body;
  if (!name?.trim() || !email?.trim() || !password || !role) {
    return res.status(400).json({ message: "Name, email, password and role are required" });
  }
  if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, department_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${publicUserFields}`,
      [name.trim(), email.trim().toLowerCase(), hash, role, department_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(error.code === "23505" ? 409 : 400).json({ message: "Unable to create user" });
  }
};

exports.setActive = async (req, res) => {
  const active = Boolean(req.body.is_active);
  if (Number(req.params.id) === req.user.id && !active) {
    return res.status(400).json({ message: "You cannot deactivate your own account" });
  }
  const result = await pool.query(
    `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING ${publicUserFields}`,
    [active, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ message: "User not found" });
  res.json(result.rows[0]);
};

exports.listDepartments = async (_req, res) => {
  const result = await pool.query("SELECT id, code, name FROM departments ORDER BY id");
  res.json(result.rows);
};
