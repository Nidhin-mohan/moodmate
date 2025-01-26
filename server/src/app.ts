
// import dotenv from "dotenv";
import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import { errorHandler, notFound } from "./middlewares/errorMiddleware";

const app: Application = express();

// dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;