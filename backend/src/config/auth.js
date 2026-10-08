const jwt = require("jsonwebtoken");

const getSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in backend/.env");
  }
  return process.env.JWT_SECRET;
};

exports.signToken = (user) => jwt.sign(
  { id: user.id, role: user.role, departmentId: user.department_id, name: user.name },
  getSecret(),
  { expiresIn: "1d" }
);

exports.verifyToken = (token) => jwt.verify(token, getSecret());
