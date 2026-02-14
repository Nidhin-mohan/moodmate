
// import dotenv from "dotenv";
import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import moodLogRoutes from "./routes/moodLogRoutes";
import { errorHandler, notFound } from "./middlewares/errorMiddleware";

const app: Application = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Moodmate",
  });
})
app.use("/auth", authRoutes);
app.use("/mood", moodLogRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;