
// import dotenv from "dotenv";
import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import { errorHandler, notFound } from "./middlewares/errorMiddleware";

const app: Application = express();

// dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;



// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";



// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.get("/", (req, res) => {
//   res.send("Server is running!");
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
