const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { signToken } = require("../config/auth");

// Register
exports.register = async (req, res) => {
  const { name, email, password, role, department_id } = req.body;

  try {
    if (!name?.trim() || !email?.trim() || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password, role, department_id) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [name, email, hashedPassword, role, department_id]
    );

    const user = result.rows[0];
    res.status(201).json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      department_id: user.department_id, is_active: user.is_active,
    });
  } catch (err) {
    console.error(err);
    res.status(err.code === "23505" ? 409 : 500).json({ message: "Error registering user" });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch || !user.is_active) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken(user);

    res.json({ token, user: { id: user.id, name: user.name, role: user.role, departmentId: user.department_id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }
};

exports.me = async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name AS department_name
     FROM users u LEFT JOIN departments d ON d.id = u.department_id WHERE u.id = $1`,
    [req.user.id]
  );
  res.json(result.rows[0]);
};
