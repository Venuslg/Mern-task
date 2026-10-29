import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (email.length > 254) {
      return res.status(400).json({ message: "Email addresses must be 254 characters or fewer." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ message: "Password must be 72 bytes or fewer." });
    }

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Never store plain-text passwords.
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });

    return res.status(201).json({
      message: "Account created successfully. You can now log in.",
      user: { id: user._id, email: user.email }
    });
  } catch (error) {
    // The unique index also protects against simultaneous duplicate requests.
    if (error?.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    console.error("Signup error:", error.message);
    return res.status(500).json({ message: "Unable to create your account right now." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (email.length > 254) {
      return res.status(400).json({ message: "Email addresses must be 254 characters or fewer." });
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ message: "Password must be 72 bytes or fewer." });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    return res.json({
      message: "Signed in successfully.",
      user: { id: user._id, email: user.email }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Unable to sign in right now." });
  }
});

export default router;
