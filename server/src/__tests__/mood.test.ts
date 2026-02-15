import { request, createAuthenticatedUser, validMoodLog } from "./helpers";

describe("Mood Log Endpoints", () => {
  let token: string;

  beforeEach(async () => {
    const user = await createAuthenticatedUser();
    token = user.token;
  });

  const authRequest = () => ({
    post: (url: string) => request.post(url).set("Authorization", `Bearer ${token}`),
    get: (url: string) => request.get(url).set("Authorization", `Bearer ${token}`),
    put: (url: string) => request.put(url).set("Authorization", `Bearer ${token}`),
    delete: (url: string) => request.delete(url).set("Authorization", `Bearer ${token}`),
  });

  // ── Create ──────────────────────────────────────────

  describe("POST /api/v1/mood", () => {
    it("creates a mood log", async () => {
      const res = await authRequest()
        .post("/api/v1/mood")
        .send(validMoodLog);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mood).toBe("happy");
      expect(res.body.data.intensity).toBe(7);
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data).toHaveProperty("user");
    });

    it("rejects unauthenticated request with 401", async () => {
      const res = await request
        .post("/api/v1/mood")
        .send(validMoodLog);

      expect(res.status).toBe(401);
    });

    it("rejects invalid intensity (> 10) with 400", async () => {
      const res = await authRequest()
        .post("/api/v1/mood")
        .send({ ...validMoodLog, intensity: 15 });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("rejects missing required fields with 400", async () => {
      const res = await authRequest()
        .post("/api/v1/mood")
        .send({ mood: "happy" });

      expect(res.status).toBe(400);
    });
  });

  // ── Read All ────────────────────────────────────────

  describe("GET /api/v1/mood", () => {
    it("returns empty list when no logs exist", async () => {
      const res = await authRequest().get("/api/v1/mood");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it("returns paginated mood logs", async () => {
      // Create 3 logs
      for (let i = 0; i < 3; i++) {
        await authRequest()
          .post("/api/v1/mood")
          .send({ ...validMoodLog, intensity: i + 1 });
      }

      const res = await authRequest().get("/api/v1/mood?page=1&limit=2");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(3);
      expect(res.body.pages).toBe(2);
      expect(res.body.page).toBe(1);
    });

    it("does not return another user's logs", async () => {
      // Create log with first user
      await authRequest()
        .post("/api/v1/mood")
        .send(validMoodLog);

      // Create second user and request their logs
      const otherUser = await createAuthenticatedUser({
        email: "other@example.com",
      });

      const res = await request
        .get("/api/v1/mood")
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("filters by mood", async () => {
      await authRequest()
        .post("/api/v1/mood")
        .send({ ...validMoodLog, mood: "happy" });
      await authRequest()
        .post("/api/v1/mood")
        .send({ ...validMoodLog, mood: "sad" });

      const res = await authRequest().get("/api/v1/mood?mood=happy");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].mood).toBe("happy");
    });
  });

  // ── Read One ────────────────────────────────────────

  describe("GET /api/v1/mood/:id", () => {
    it("returns a single mood log by id", async () => {
      const createRes = await authRequest()
        .post("/api/v1/mood")
        .send(validMoodLog);
      const id = createRes.body.data._id;

      const res = await authRequest().get(`/api/v1/mood/${id}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(id);
      expect(res.body.data.mood).toBe("happy");
    });

    it("returns 404 for non-existent id", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await authRequest().get(`/api/v1/mood/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe("NOT_FOUND");
    });

    it("cannot access another user's log", async () => {
      const createRes = await authRequest()
        .post("/api/v1/mood")
        .send(validMoodLog);
      const id = createRes.body.data._id;

      const otherUser = await createAuthenticatedUser({
        email: "sneaky@example.com",
      });

      const res = await request
        .get(`/api/v1/mood/${id}`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Update ──────────────────────────────────────────

  describe("PUT /api/v1/mood/:id", () => {
    it("updates a mood log", async () => {
      const createRes = await authRequest()
        .post("/api/v1/mood")
        .send(validMoodLog);
      const id = createRes.body.data._id;

      const res = await authRequest()
        .put(`/api/v1/mood/${id}`)
        .send({ mood: "calm", intensity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data.mood).toBe("calm");
      expect(res.body.data.intensity).toBe(3);
      // Unchanged fields stay the same
      expect(res.body.data.energyLevel).toBe(validMoodLog.energyLevel);
    });

    it("returns 404 for non-existent id", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await authRequest()
        .put(`/api/v1/mood/${fakeId}`)
        .send({ mood: "calm" });

      expect(res.status).toBe(404);
    });

    it("rejects invalid update data with 400", async () => {
      const createRes = await authRequest()
        .post("/api/v1/mood")
        .send(validMoodLog);
      const id = createRes.body.data._id;

      const res = await authRequest()
        .put(`/api/v1/mood/${id}`)
        .send({ intensity: 999 });

      expect(res.status).toBe(400);
    });
  });

  // ── Delete ──────────────────────────────────────────

  describe("DELETE /api/v1/mood/:id", () => {
    it("deletes a mood log", async () => {
      const createRes = await authRequest()
        .post("/api/v1/mood")
        .send(validMoodLog);
      const id = createRes.body.data._id;

      const res = await authRequest().delete(`/api/v1/mood/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's actually gone
      const getRes = await authRequest().get(`/api/v1/mood/${id}`);
      expect(getRes.status).toBe(404);
    });

    it("returns 404 for non-existent id", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await authRequest().delete(`/api/v1/mood/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Stats ───────────────────────────────────────────

  describe("GET /api/v1/mood/stats", () => {
    it("returns stats for user's mood logs", async () => {
      await authRequest()
        .post("/api/v1/mood")
        .send({ ...validMoodLog, mood: "happy", intensity: 8 });
      await authRequest()
        .post("/api/v1/mood")
        .send({ ...validMoodLog, mood: "happy", intensity: 6 });
      await authRequest()
        .post("/api/v1/mood")
        .send({ ...validMoodLog, mood: "sad", intensity: 4 });

      const res = await authRequest().get("/api/v1/mood/stats?days=30");

      expect(res.status).toBe(200);
      expect(res.body.data.totalLogs).toBe(3);
      expect(res.body.data.moodBreakdown).toEqual({ happy: 2, sad: 1 });
      expect(res.body.data).toHaveProperty("avgIntensity");
      expect(res.body.data).toHaveProperty("avgSleepHours");
    });

    it("returns empty stats when no logs exist", async () => {
      const res = await authRequest().get("/api/v1/mood/stats");

      expect(res.status).toBe(200);
      expect(res.body.data.totalLogs).toBe(0);
      expect(res.body.data.moodBreakdown).toEqual({});
    });
  });
});
