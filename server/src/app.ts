import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import moodLogRoutes from "./routes/moodLogRoutes";
import { errorHandler, notFound } from "./middlewares/errorMiddleware";

const app: Application = express();

const allowedOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? "healthy" : "unhealthy",
    db: isHealthy ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Moodmate",
  });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/mood", moodLogRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
