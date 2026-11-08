import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { createMoodLog, getAllMoodLogs } from "@/services/moodLogService";
import Dashboard from "./Dashboard";

const fx = vi.hoisted(() => {
  const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  const log = (fields: Record<string, unknown>) => ({
    _id: Math.random().toString(36).slice(2),
    user: "u",
    tagsPeople: [],
    tagsPlaces: [],
    tagsEvents: [],
    createdAt: iso(0),
    updatedAt: "",
    ...fields,
  });
  return {
    logs: [
      log({ mood: "Neutral", date: iso(1), notes: "Long day, but the walk helped.", tagsPeople: ["Mom"], intensity: 6 }),
      log({ mood: "Happy", date: iso(2) }),
      log({ mood: "sad", date: iso(3) }),
    ],
  };
});

vi.mock("@/services/moodLogService", () => ({
  getAllMoodLogs: vi.fn(() => Promise.resolve({ success: true, count: 3, total: 3, page: 1, pages: 1, data: fx.logs })),
  createMoodLog: vi.fn((d: { mood: string }) =>
    Promise.resolve({ success: true, data: { _id: "new", user: "u", mood: d.mood, createdAt: "", updatedAt: "" } })
  ),
}));
vi.mock("@/utils/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { name: "Asha Rao" } }) }));

function LogScreen() {
  const state = useLocation().state as { saved?: { mood: string } } | null;
  return <p>Log screen for {state?.saved?.mood}</p>;
}

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mood-tracking" element={<LogScreen />} />
      </Routes>
    </MemoryRouter>
  );

describe("Dashboard", () => {
  it("greets the user and asks how they feel", async () => {
    renderDashboard();

    expect(screen.getByText(/, Asha$/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /how are you feeling right now/i })).toBeInTheDocument();
    await screen.findByText(/checked in 3 times this week/i);
  });

  it("tapping a face saves a quick log and continues on the log screen", async () => {
    renderDashboard();

    await userEvent.click(screen.getByRole("button", { name: "Anxious" }));

    expect(await screen.findByText("Log screen for Anxious")).toBeInTheDocument();
    expect(createMoodLog).toHaveBeenCalledWith({ mood: "Anxious" });
  });

  it("shows the 7-day strip with empty days and the last entry", async () => {
    renderDashboard();

    const week = await screen.findByRole("region", { name: "Your week" });
    expect(within(week).getAllByRole("listitem")).toHaveLength(7);
    expect(within(week).getAllByText(/no check-in/i).length).toBeGreaterThanOrEqual(4);

    expect(screen.getByText("Long day, but the walk helped.")).toBeInTheDocument();
    expect(screen.getByText("Intensity 6/10")).toBeInTheDocument();
    expect(screen.getByText("Mom")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see trends/i })).toHaveAttribute("href", "/mood-history?tab=trends");
  });

  it("has no stat tiles or canned quote", async () => {
    renderDashboard();
    await screen.findByText(/checked in/i);

    expect(screen.queryByText(/daily insight/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dalai lama/i)).not.toBeInTheDocument();
  });

  it("welcomes a new user with a kind empty state", async () => {
    vi.mocked(getAllMoodLogs).mockResolvedValueOnce({ success: true, count: 0, total: 0, page: 1, pages: 0, data: [] });
    renderDashboard();

    expect(await screen.findByText(/your journal starts with your first check-in/i)).toBeInTheDocument();
    expect(screen.getByText(/no check-ins yet this week/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /see trends/i })).not.toBeInTheDocument();
  });

  it("keeps the quick log usable if the week fails to load", async () => {
    vi.mocked(getAllMoodLogs).mockRejectedValueOnce(new Error("down"));
    renderDashboard();

    await waitFor(() => expect(screen.getByText(/couldn't load your week/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Happy" })).toBeEnabled();
  });
});
