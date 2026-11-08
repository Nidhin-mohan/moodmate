import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import api from "@/api";
import Login from "./Login";

vi.mock("@/api", () => ({ default: { post: vi.fn() } }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ login: vi.fn() }) }));

const unauthorized = new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
  status: 401,
  statusText: "Unauthorized",
  data: { message: "Invalid email or password" },
  headers: {},
  config: { headers: new AxiosHeaders() },
});

describe("Login", () => {
  it("shows the server's message on a wrong password and keeps the email", async () => {
    vi.mocked(api.post).mockRejectedValue(unauthorized);
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText("hello@example.com"), "me@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(screen.getByPlaceholderText("hello@example.com")).toHaveValue("me@example.com");
  });
});
