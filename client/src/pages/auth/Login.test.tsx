import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { login as loginRequest } from "@/services/authServices";
import Login from "./Login";

const { authLogin, navigate } = vi.hoisted(() => ({ authLogin: vi.fn(), navigate: vi.fn() }));

vi.mock("@/services/authServices", () => ({ login: vi.fn() }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ login: authLogin }) }));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

const fillAndSubmit = async (email: string, password: string) => {
  await userEvent.type(screen.getByPlaceholderText("hello@example.com"), email);
  await userEvent.type(screen.getByPlaceholderText("••••••••"), password);
  await userEvent.click(screen.getByRole("button", { name: "Log In" }));
};

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe("Login", () => {
  it("logs in through authServices and goes to the dashboard", async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      success: true,
      message: "Login successful",
      data: { userId: "u1", _id: "u1", name: "Me", email: "me@example.com", token: "tok" },
    });
    renderLogin();

    await fillAndSubmit("me@example.com", "secret");

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/dashboard"));
    expect(loginRequest).toHaveBeenCalledWith({ email: "me@example.com", password: "secret" });
    expect(authLogin).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", email: "me@example.com" }),
      "tok"
    );
  });

  it("shows the service's message on a wrong password and keeps the email", async () => {
    vi.mocked(loginRequest).mockRejectedValue(new Error("Invalid email or password"));
    renderLogin();

    await fillAndSubmit("me@example.com", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(screen.getByPlaceholderText("hello@example.com")).toHaveValue("me@example.com");
  });
});
