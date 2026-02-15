import { z } from "zod";

// Validate all environment variables once at startup.
// If anything is missing or invalid, the app crashes immediately
// with a clear message — instead of failing deep in a DB call or
// JWT sign with "Cannot read properties of undefined".

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
});

// This runs at import time. If validation fails, the process
// exits with a readable error before the server even starts.
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Environment validation failed:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
