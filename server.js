import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use("/api/auth", authRoutes);

// Serve React production build
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) res.status(404).send("Frontend build not found. Run npm run build first.");
  });
});

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("Missing MONGODB_URI. Copy .env.example to .env and configure MongoDB.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");
    app.listen(PORT, () => console.log(`Express API running at http://localhost:${PORT}`));
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    console.error("Check that MongoDB is running and MONGODB_URI in .env is correct.");
    process.exit(1);
  }
}

startServer();