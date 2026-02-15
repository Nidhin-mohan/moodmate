import "dotenv/config";
import { env } from "./config/env";
import app from "./app";
import { connectDB } from "./config/db";
import mongoose from "mongoose";

const PORT = env.PORT;

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log("HTTP server closed");
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start();
