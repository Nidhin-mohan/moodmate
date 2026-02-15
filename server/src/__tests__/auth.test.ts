import { request, createAuthenticatedUser } from "./helpers";

describe("Auth Endpoints", () => {
  // ── Registration ──────────────────────────────────────

  describe("POST /api/v1/auth/register", () => {
    it("registers a new user and returns token", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data).toHaveProperty("userId");
      expect(res.body.data.name).toBe("John Doe");
      expect(res.body.data.email).toBe("john@example.com");
      // Password should never be in the response
      expect(res.body.data).not.toHaveProperty("password");
    });

    it("rejects duplicate email with 409", async () => {
      // Register first user
      await request
        .post("/api/v1/auth/register")
        .send({
          name: "First User",
          email: "duplicate@example.com",
          password: "password123",
        });

      // Try to register with same email
      const res = await request
        .post("/api/v1/auth/register")
        .send({
          name: "Second User",
          email: "duplicate@example.com",
          password: "password456",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("CONFLICT");
    });

    it("rejects invalid email with 400", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({
          name: "Bad Email",
          email: "not-an-email",
          password: "password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it("rejects short password with 400", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({
          name: "Short Pass",
          email: "short@example.com",
          password: "12345",
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("rejects missing fields with 400", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ── Login ─────────────────────────────────────────────

  describe("POST /api/v1/auth/login", () => {
    it("logs in with correct credentials", async () => {
      // Register first
      await request
        .post("/api/v1/auth/register")
        .send({
          name: "Login User",
          email: "login@example.com",
          password: "password123",
        });

      // Login
      const res = await request
        .post("/api/v1/auth/login")
        .send({
          email: "login@example.com",
          password: "password123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.email).toBe("login@example.com");
    });

    it("rejects wrong password with 401", async () => {
      await request
        .post("/api/v1/auth/register")
        .send({
          name: "Wrong Pass",
          email: "wrongpass@example.com",
          password: "password123",
        });

      const res = await request
        .post("/api/v1/auth/login")
        .send({
          email: "wrongpass@example.com",
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("UNAUTHORIZED");
    });

    it("rejects non-existent email with 401", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .send({
          email: "nobody@example.com",
          password: "password123",
        });

      expect(res.status).toBe(401);
    });
  });

  // ── Profile ───────────────────────────────────────────

  describe("GET /api/v1/auth/profile", () => {
    it("returns profile for authenticated user", async () => {
      const { token } = await createAuthenticatedUser();

      const res = await request
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("userId");
      expect(res.body.data).toHaveProperty("name");
      expect(res.body.data).toHaveProperty("email");
    });

    it("rejects request without token with 401", async () => {
      const res = await request.get("/api/v1/auth/profile");

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe("UNAUTHORIZED");
    });

    it("rejects request with invalid token with 401", async () => {
      const res = await request
        .get("/api/v1/auth/profile")
        .set("Authorization", "Bearer invalid-token-here");

      expect(res.status).toBe(401);
    });
  });
});
