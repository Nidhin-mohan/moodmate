import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { createMoodLog, getAllMoodLogs, updateMoodLog } from "@/services/moodLogService";
import { showToast } from "@/utils/toast";
import MoodTrackingForm from "./MoodTrackingForm";

const fx = vi.hoisted(() => ({
  saved: (mood: string) => ({
    success: true,
    data: { _id: "log1", user: "u", mood, tagsPeople: [], tagsPlaces: [], tagsEvents: [], createdAt: "2026-11-08T20:12:00Z", updatedAt: "" },
  }),
}));

vi.mock("@/services/moodLogService", () => ({
  createMoodLog: vi.fn((data: { mood: string }) => Promise.resolve(fx.saved(data.mood))),
  updateMoodLog: vi.fn(() => Promise.resolve(fx.saved("Sad"))),
  getAllMoodLogs: vi.fn(() =>
    Promise.resolve({ success: true, count: 1, total: 1, page: 1, pages: 1, data: [{ tagsPeople: ["Mom"], tagsPlaces: [], tagsEvents: [] }] })
  ),
}));
vi.mock("@/utils/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const renderFlow = (state?: unknown) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/mood-tracking", state }]}>
      <Routes>
        <Route path="/mood-tracking" element={<MoodTrackingForm />} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
        <Route path="/tools" element={<p>Tools page</p>} />
      </Routes>
    </MemoryRouter>
  );

const pickMood = async (mood: string) => {
  await userEvent.click(screen.getByRole("button", { name: mood }));
  await screen.findByRole("heading", { name: /thank you for checking in/i });
};

describe("Mood log flow", () => {
  it("saves a quick log with only the mood, the moment a face is tapped", async () => {
    renderFlow();

    await pickMood("Happy");

    expect(createMoodLog).toHaveBeenCalledOnce();
    expect(vi.mocked(createMoodLog).mock.calls[0][0]).toEqual({ mood: "Happy" });
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("offers a dismissible breather nudge after a low-mood quick log", async () => {
    renderFlow();

    await pickMood("Anxious");

    const nudge = screen.getByRole("note");
    expect(nudge).toHaveTextContent(/1-minute breather/i);
    expect(screen.getByRole("link", { name: "Try one" })).toHaveAttribute("href", "/tools#calm");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("shows full support with sample helplines after a strong low mood, without blocking", async () => {
    renderFlow();
    await pickMood("Sad");

    await userEvent.click(screen.getByRole("button", { name: "Add details" }));
    await userEvent.click(await screen.findByRole("radio", { name: "8" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText(/sample data/i)).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/step 2 of 4/i)).toBeInTheDocument();
  });

  it("does not show full support below intensity 7", async () => {
    renderFlow();
    await pickMood("Sad");

    await userEvent.click(screen.getByRole("button", { name: "Add details" }));
    await userEvent.click(await screen.findByRole("radio", { name: "4" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText(/step 2 of 4/i)).toBeInTheDocument();
    expect(screen.queryByText(/sample data/i)).not.toBeInTheDocument();
  });

  it("sends only the answered details, skipping steps, then returns to the dashboard", async () => {
    renderFlow();
    await pickMood("Sad");
    await userEvent.click(screen.getByRole("button", { name: "Add details" }));

    // Step 1: intensity
    await userEvent.click(await screen.findByRole("radio", { name: "5" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    // Step 2: skip energy & sleep
    await screen.findByText(/step 2 of 4/i);
    await userEvent.click(await screen.findByRole("button", { name: "Skip" }));
    // Step 3: add a person from suggestions
    await screen.findByText(/step 3 of 4/i);
    await userEvent.click(await screen.findByRole("button", { name: "+ Mom" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    // Step 4: a note, then finish
    await screen.findByText(/step 4 of 4/i);
    await userEvent.type(await screen.findByLabelText(/anything you want to remember/i), "Long day");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await screen.findByText("Dashboard page");
    expect(updateMoodLog).toHaveBeenCalledWith("log1", {
      intensity: 5,
      tagsPeople: ["Mom"],
      notes: "Long day",
    });
    expect(getAllMoodLogs).toHaveBeenCalled();
  });

  it("skipping a step clears what was picked on it", async () => {
    renderFlow();
    await pickMood("Happy");
    await userEvent.click(screen.getByRole("button", { name: "Add details" }));

    await userEvent.click(await screen.findByRole("radio", { name: "3" }));
    await userEvent.click(await screen.findByRole("button", { name: "Skip" }));
    await screen.findByText(/step 2 of 4/i);
    await waitFor(() => expect(screen.queryByText(/step 1 of 4/i)).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /i.m done/i }));

    await screen.findByText("Dashboard page");
    expect(updateMoodLog).not.toHaveBeenCalled();
  });

  it("'I'm done for now' after a quick log leaves without any update", async () => {
    renderFlow();
    await pickMood("Neutral");

    await userEvent.click(screen.getByRole("button", { name: /i'm done for now/i }));

    await screen.findByText("Dashboard page");
    expect(updateMoodLog).not.toHaveBeenCalled();
  });

  it("starts on the saved screen when the dashboard already logged the mood", async () => {
    renderFlow({ saved: fx.saved("Excited").data });

    expect(await screen.findByRole("heading", { name: /thank you for checking in/i })).toBeInTheDocument();
    expect(createMoodLog).not.toHaveBeenCalled();
  });

  it("keeps the picker and explains when saving fails", async () => {
    vi.mocked(createMoodLog).mockRejectedValueOnce(new Error("Network down"));
    renderFlow();

    await userEvent.click(screen.getByRole("button", { name: "Happy" }));

    await waitFor(() => expect(showToast.error).toHaveBeenCalledWith("Network down"));
    expect(screen.getByRole("button", { name: "Happy" })).toBeEnabled();
  });
});
