// This runs BEFORE any module is imported (via setupFiles in jest.config).
// It sets the env vars that env.ts will validate when app.ts is imported.
// These are test-only values — the real .env is not loaded during tests.

process.env.MONGO_URI = "mongodb://localhost:27017/test";
process.env.JWT_SECRET = "test-secret-key-at-least-16-chars";
process.env.NODE_ENV = "test";
process.env.CORS_ORIGINS = "http://localhost:5173";
