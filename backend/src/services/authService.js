const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");

const registerUser = async (name, email, password) => {
  // Check whether email already exists
  const [existingUsers] = await pool.query(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (existingUsers.length > 0) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password)
     VALUES (?, ?, ?)`,
    [name, email, hashedPassword]
  );

  return {
    id: result.insertId,
    name,
    email,
  };
};

const loginUser = async (email, password) => {
  // Find user
  const [users] = await pool.query(
    `SELECT id, name, email, password
     FROM users
     WHERE email = ?`,
    [email]
  );

  if (users.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = users[0];

  // Compare password
  const passwordMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
};