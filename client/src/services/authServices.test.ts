import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";
import api from "@/api";
import { login, signup } from "./authServices";

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

describe("login", () => {
  it("posts credentials to /auth/login and returns the response body", async () => {
    post.mockResolvedValue({ data: { success: true, data: { token: "t" } } });

    const res = await login({ email: "a@b.co", password: "pw" });

    expect(post).toHaveBeenCalledWith("/auth/login", { email: "a@b.co", password: "pw" });
    expect(res.data.token).toBe("t");
  });

  it("surfaces the server's message on bad credentials", async () => {
    post.mockRejectedValue(axiosErrorWith({ message: "Invalid email or password" }));
    await expect(login({ email: "a@b.co", password: "x" })).rejects.toThrow(
      "Invalid email or password"
    );
  });

  it("falls back to a friendly message when the server sends none", async () => {
    post.mockRejectedValue(axiosErrorWith());
    await expect(login({ email: "a@b.co", password: "x" })).rejects.toThrow(
      "Login failed. Please try again."
    );
  });
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
