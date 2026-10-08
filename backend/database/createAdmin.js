require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../src/config/db");

const [, , name, email, password] = process.argv;

async function main() {
  if (!name || !email || !password) {
    throw new Error("Usage: npm run create-admin -- \"Name\" email@example.com password");
  }
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  const existing = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (existing.rows.length) throw new Error("An admin account already exists. Use the admin dashboard to create more users.");
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')",
    [name.trim(), email.trim().toLowerCase(), hash]
  );
  console.log("Admin account created.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
