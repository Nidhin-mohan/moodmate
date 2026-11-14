import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";
import api from "@/api";
import { createMoodLog, updateMoodLog } from "./moodLogService";

vi.mock("@/api", () => ({ default: { post: vi.fn(), get: vi.fn(), put: vi.fn() } }));

const post = vi.mocked(api.post);
const put = vi.mocked(api.put);

const axiosErrorWith = (data?: { message: string }) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    data,
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe("createMoodLog", () => {
  it("accepts a mood-only quick log", async () => {
    post.mockResolvedValue({ data: { success: true, data: { _id: "1", mood: "Sad" } } });

    const res = await createMoodLog({ mood: "Sad" });

    expect(post).toHaveBeenCalledWith("/mood", { mood: "Sad" });
    expect(res.data._id).toBe("1");
  });
});

describe("updateMoodLog", () => {
  it("PUTs only the patch to /mood/:id and returns the updated log", async () => {
    put.mockResolvedValue({ data: { success: true, data: { _id: "abc", mood: "Sad", intensity: 8 } } });

    const res = await updateMoodLog("abc", { intensity: 8 });

    expect(put).toHaveBeenCalledWith("/mood/abc", { intensity: 8 });
    expect(res.data.intensity).toBe(8);
  });

  it("surfaces the server's message", async () => {
    put.mockRejectedValue(axiosErrorWith({ message: "Validation failed" }));
    await expect(updateMoodLog("abc", { intensity: 99 })).rejects.toThrow("Validation failed");
  });

  it("falls back to a friendly message", async () => {
    put.mockRejectedValue(axiosErrorWith());
    await expect(updateMoodLog("abc", { intensity: 5 })).rejects.toThrow(
      "Couldn't save your details. Please try again."
    );
  });
});
