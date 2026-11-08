import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { getAllMoodLogs } from "@/services/moodLogService";
import MoodHistory from "./MoodHistory";

// Locks in pagination: QA on 2026-11-08 suspected logs past the 10th were
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
          mood: `Mood on page ${params.page}`,
          intensity: 5,
          energyLevel: 5,
          sleepHours: 7,
          sleepQuality: 3,
          exercise: false,
          date: "2026-11-01T10:00:00.000Z",
          createdAt: "2026-11-01T10:00:00.000Z",
        },
      ],
    })
  ),
}));

describe("MoodHistory pagination", () => {
  it("pages through older logs with Next and Previous", async () => {
    render(
      <MemoryRouter>
        <MoodHistory />
      </MemoryRouter>
    );

    expect(await screen.findByText("Mood on page 1")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText("Mood on page 2")).toBeInTheDocument();
    await waitFor(() =>
      expect(getAllMoodLogs).toHaveBeenLastCalledWith({ page: 2, limit: 10 })
    );

    await userEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(await screen.findByText("Mood on page 1")).toBeInTheDocument();
  });
});
