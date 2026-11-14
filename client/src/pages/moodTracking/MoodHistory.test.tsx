import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { getAllMoodLogs, getMoodStats } from "@/services/moodLogService";
import MoodHistory from "./MoodHistory";

const fx = vi.hoisted(() => ({
  stats: (overrides = {}) => ({
    success: true,
    data: {
      period: "Last 30 days",
      avgIntensity: 6.5,
      avgEnergyLevel: null,
      avgSleepHours: 7.2,
      avgSleepQuality: null,
      totalLogs: 5,
      moodBreakdown: { Happy: 3, sad: 2 },
      ...overrides,
    },
  }),
}));

// Pagination is locked in: QA on 2026-11-08 suspected logs past the 10th were
// unreachable, but the controls only appear once there is more than one page.
vi.mock("@/services/moodLogService", () => ({
  getAllMoodLogs: vi.fn((params: { page: number }) =>
    Promise.resolve({
      success: true,
      count: 1,
      total: 21,
      page: params.page,
      pages: 3,
      data: [
        {
          _id: `log-${params.page}`,
          user: "u",
          mood: "Sad",
          notes: `Note on page ${params.page}`,
          tagsPeople: [],
          tagsPlaces: [],
          tagsEvents: [],
          date: "2026-11-01T10:00:00.000Z",
          createdAt: "2026-11-01T10:00:00.000Z",
          updatedAt: "",
        },
        {
          _id: `quick-${params.page}`,
          user: "u",
          mood: "calm",
          tagsPeople: [],
          tagsPlaces: [],
          tagsEvents: [],
          date: "2026-11-01T08:00:00.000Z",
          createdAt: "2026-11-01T08:00:00.000Z",
          updatedAt: "",
        },
      ],
    })
  ),
  getMoodStats: vi.fn(() => Promise.resolve(fx.stats())),
}));

const renderAt = (url = "/mood-history") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MoodHistory />
    </MemoryRouter>
  );

describe("History: Journal", () => {
  it("opens on the Journal tab, grouped by day", async () => {
    renderAt();

    expect(screen.getByRole("tab", { name: "Journal" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText("Note on page 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /november 1/i })).toBeInTheDocument();
  });

  it("shows mood-only and legacy entries cleanly, with no undefined values", async () => {
    renderAt();
    await screen.findByText("Note on page 1");

    expect(screen.getByText("Calm")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/undefined|NaN/);
  });

  it("pages through older entries", async () => {
    renderAt();

    expect(await screen.findByText("Note on page 1")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /newer/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /older/i }));
    expect(await screen.findByText("Note on page 2")).toBeInTheDocument();
    await waitFor(() => expect(getAllMoodLogs).toHaveBeenLastCalledWith({ page: 2, limit: 10 }));

    await userEvent.click(screen.getByRole("button", { name: /newer/i }));
    expect(await screen.findByText("Note on page 1")).toBeInTheDocument();
  });

  it("filters by tapping a mood, and clears on a second tap", async () => {
    renderAt();
    await screen.findByText("Note on page 1");

    const sad = screen.getByRole("button", { name: "Show only Sad" });
    await userEvent.click(sad);
    await waitFor(() => expect(getAllMoodLogs).toHaveBeenLastCalledWith({ page: 1, limit: 10, mood: "Sad" }));
    expect(sad).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(sad);
    await waitFor(() => expect(getAllMoodLogs).toHaveBeenLastCalledWith({ page: 1, limit: 10 }));
  });

  it("filters by a preset range and goes back to page 1", async () => {
    renderAt();
    await screen.findByText("Note on page 1");
    await userEvent.click(screen.getByRole("button", { name: /older/i }));
    await screen.findByText("Note on page 2");

    await userEvent.click(screen.getByRole("radio", { name: "This week" }));

    await waitFor(() => {
      const params = vi.mocked(getAllMoodLogs).mock.lastCall?.[0];
      expect(params).toMatchObject({ page: 1, limit: 10 });
      expect(new Date(params!.startDate!).getTime()).toBeLessThan(Date.now());
      // About 7 days back (a minute of slack for test run time).
      expect(Date.now() - new Date(params!.startDate!).getTime()).toBeLessThanOrEqual(7 * 86_400_000 + 60_000);
    });
  });
});

describe("History: Trends", () => {
  it("opens Trends directly from ?tab=trends", async () => {
    renderAt("/mood-history?tab=trends");

    expect(screen.getByRole("tab", { name: "Trends" })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(getMoodStats).toHaveBeenCalledWith(30));
  });

  it("shows the mood breakdown with labels and counts, and averages only for recorded data", async () => {
    renderAt("/mood-history?tab=trends");

    const breakdown = await screen.findByRole("list", { name: /mood breakdown/i });
    const rows = within(breakdown).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent(/Happy.*3/);
    expect(rows[1]).toHaveTextContent(/Sad.*2/);

    expect(screen.getByText("6.5")).toBeInTheDocument();
    expect(screen.getByText("7.2")).toBeInTheDocument();
    expect(screen.getAllByText(/not enough data yet/i)).toHaveLength(2);
  });

  it("switches the period", async () => {
    renderAt("/mood-history?tab=trends");
    await screen.findByRole("list", { name: /mood breakdown/i });

    await userEvent.click(screen.getByRole("radio", { name: "90 days" }));

    await waitFor(() => expect(getMoodStats).toHaveBeenLastCalledWith(90));
  });

  it("is kind when there is nothing to show yet", async () => {
    vi.mocked(getMoodStats).mockResolvedValueOnce(
      fx.stats({ totalLogs: 0, moodBreakdown: {}, avgIntensity: null, avgSleepHours: null })
    );
    renderAt("/mood-history?tab=trends");

    expect(await screen.findByText(/no check-ins in this period/i)).toBeInTheDocument();
  });

  it("switches tabs and keeps it in the URL", async () => {
    renderAt();
    await userEvent.click(screen.getByRole("tab", { name: "Trends" }));

    expect(screen.getByRole("tab", { name: "Trends" })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(getMoodStats).toHaveBeenCalled());
  });
});
