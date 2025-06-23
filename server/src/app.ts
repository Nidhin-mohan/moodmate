
// import dotenv from "dotenv";
import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import { errorHandler, notFound } from "./middlewares/errorMiddleware";

const app: Application = express();

const corsOptions = {
  origin: "http://localhost:5173", // Replace with your frontend origin
  credentials: true, // Allow credentials
};

// Middleware
app.use(cors(corsOptions));

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

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;