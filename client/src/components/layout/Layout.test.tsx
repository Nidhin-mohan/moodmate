import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Layout from "./Layout";

const auth = vi.hoisted(() => ({
  value: { isLoggedIn: true, user: { name: "Asha", role: "user" as string }, logout: () => {} },
}));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth.value }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Layout>
        <p>Page</p>
      </Layout>
    </MemoryRouter>
  );

describe("App shell", () => {
  it("shows the floating log button on logged-in pages, but not on the dashboard or log screen", () => {
    // jsdom ignores breakpoints: desktop top-bar button + phone floating button.
    const { unmount } = renderAt("/mood-history");
    expect(screen.getAllByRole("link", { name: "Log mood" })).toHaveLength(2);
    unmount();

    for (const path of ["/dashboard", "/mood-tracking"]) {
      const view = renderAt(path);
      // Only the desktop top-bar button remains.
      expect(screen.getAllByRole("link", { name: "Log mood" })).toHaveLength(1);
      view.unmount();
    }
  });

  it("reaches every destination from the mobile menu, including support", async () => {
    renderAt("/mood-history");

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = document.getElementById("mobile-menu")!;
    for (const name of ["Home", "Journal", "Tools", "Profile", "Need support?"]) {
      expect(within(menu).getByRole("link", { name })).toBeInTheDocument();
    }
    expect(within(menu).getByRole("link", { name: "Journal" })).toHaveAttribute("aria-current", "page");
    expect(within(menu).queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(within(menu).getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("gives admins the Admin link in both menus", async () => {
    auth.value = { ...auth.value, user: { name: "Root", role: "admin" } };
    renderAt("/dashboard");

    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(within(screen.getByRole("menu")).getByRole("menuitem", { name: "Admin" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(within(document.getElementById("mobile-menu")!).getByRole("link", { name: "Admin" })).toBeInTheDocument();
    auth.value = { ...auth.value, user: { name: "Asha", role: "user" } };
  });

  it("starts each new page at the top, but leaves #hash links to scroll to their target", async () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderAt("/mood-history");
    scrollTo.mockClear();

    const desktopTools = screen.getAllByRole("link", { name: "Tools" })[0];
    await userEvent.click(desktopTools);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);

    scrollTo.mockClear();
    await userEvent.click(screen.getByRole("link", { name: "Need support?" }));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("has no floating button for logged-out visitors", () => {
    auth.value = { ...auth.value, isLoggedIn: false };
    renderAt("/tools");

    expect(screen.queryByRole("link", { name: "Log mood" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Start journaling" }).length).toBeGreaterThan(0);
    auth.value = { ...auth.value, isLoggedIn: true };
  });
});
