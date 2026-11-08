import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AdminUser } from "@/types/admin";
import AdminUsers from "./AdminUsers";

const { users } = vi.hoisted(() => {
  const row = (over: Partial<AdminUser>): AdminUser => ({
    _id: "x",
    name: "X",
    email: "x@example.com",
    role: "user",
    isPro: false,
    proSince: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over,
  });
  return {
    users: [
      row({ _id: "me", name: "Me Admin", email: "me@example.com", role: "admin" }),
      row({ _id: "other", name: "Other User", email: "other@example.com" }),
    ],
  };
});

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { userId: "me", name: "Me", email: "me@example.com", role: "admin" } }),
}));

// Implementation passed to vi.fn() (not mockResolvedValue) so restoreMocks keeps it.
vi.mock("@/services/adminService", () => ({
  listUsers: vi.fn(() => Promise.resolve({ data: users, total: 2, page: 1, pages: 1 })),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

const rowFor = async (name: string) => (await screen.findByText(name)).closest("tr") as HTMLElement;

describe("AdminUsers self-protection", () => {
  it("marks the admin's own row and offers no delete on it", async () => {
    render(<AdminUsers />);

    const mine = await rowFor("Me Admin");
    const other = await rowFor("Other User");

    expect(within(mine).getByText("You")).toBeInTheDocument();
    expect(within(mine).queryByRole("button", { name: "Delete user" })).not.toBeInTheDocument();
    expect(within(other).getByRole("button", { name: "Delete user" })).toBeInTheDocument();
  });

  it("locks the role select when editing your own row, but not others", async () => {
    render(<AdminUsers />);

    const mine = await rowFor("Me Admin");
    await userEvent.click(within(mine).getByRole("button", { name: /edit/i }));
    expect(within(mine).getByRole("combobox")).toBeDisabled();

    await userEvent.click(within(mine).getByRole("button", { name: "Cancel" }));
    const other = await rowFor("Other User");
    await userEvent.click(within(other).getByRole("button", { name: /edit/i }));
    expect(within(other).getByRole("combobox")).toBeEnabled();
  });
});
