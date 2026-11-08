import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";
import api from "@/api";
import { signup } from "./authServices";

vi.mock("@/api", () => ({ default: { post: vi.fn(), get: vi.fn() } }));

const post = vi.mocked(api.post);

const axiosErrorWith = (data?: { message: string }) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    data,
    status: 409,
    statusText: "Conflict",
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe("signup", () => {
  it("posts to /auth/register (base URL already carries /api/v1)", async () => {
    post.mockResolvedValue({ data: { success: true } });
    await signup({ name: "A", email: "a@b.co", password: "secret123" } as never);
    expect(post).toHaveBeenCalledWith("/auth/register", expect.any(Object));
  });

  it("surfaces the server's message when registration fails", async () => {
    post.mockRejectedValue(axiosErrorWith({ message: "Email already exists" }));
    await expect(signup({} as never)).rejects.toThrow("Email already exists");
  });

  it("falls back to a friendly message when the server sends none", async () => {
    post.mockRejectedValue(axiosErrorWith());
    await expect(signup({} as never)).rejects.toThrow("Registration failed. Please try again.");
  });
});
