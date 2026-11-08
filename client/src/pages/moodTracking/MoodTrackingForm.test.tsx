import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { createMoodLog } from "@/services/moodLogService";
import { showToast } from "@/utils/toast";
import MoodTrackingForm from "./MoodTrackingForm";

vi.mock("@/services/moodLogService", () => ({
  createMoodLog: vi.fn(() => Promise.resolve({})),
}));
vi.mock("@/utils/toast", () => ({
  showToast: { success: vi.fn(), error: vi.fn() },
}));

const renderForm = () =>
  render(
    <MemoryRouter>
      <MoodTrackingForm />
    </MemoryRouter>
  );

describe("MoodTrackingForm", () => {
  it("saves with exercise on and the minutes field left empty", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Happy" }));
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(screen.getByRole("button", { name: "Save Check-in" }));

    await waitFor(() => expect(createMoodLog).toHaveBeenCalledOnce());
    expect(vi.mocked(createMoodLog).mock.calls[0][0]).toMatchObject({
      mood: "Happy",
      exercise: true,
      exerciseMinutes: undefined,
    });
    expect(showToast.error).not.toHaveBeenCalled();
  });

  it("sends the minutes as a number when filled in", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Happy" }));
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.type(screen.getByPlaceholderText("e.g. 30"), "45");
    await userEvent.click(screen.getByRole("button", { name: "Save Check-in" }));

    await waitFor(() => expect(createMoodLog).toHaveBeenCalledOnce());
    expect(vi.mocked(createMoodLog).mock.calls[0][0]).toMatchObject({ exerciseMinutes: 45 });
  });

  it("names the field that is actually invalid", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Happy" }));
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.type(screen.getByPlaceholderText("e.g. 30"), "-5");
    await userEvent.click(screen.getByRole("button", { name: "Save Check-in" }));

    await waitFor(() => expect(showToast.error).toHaveBeenCalled());
    const message = vi.mocked(showToast.error).mock.calls[0][0] as string;
    expect(message).toMatch(/exercise minutes/i);
    expect(message).not.toMatch(/select a mood/i);
    expect(createMoodLog).not.toHaveBeenCalled();
  });

  it("still asks for a mood when none is selected", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Save Check-in" }));

    await waitFor(() => expect(showToast.error).toHaveBeenCalled());
    expect(vi.mocked(showToast.error).mock.calls[0][0]).toMatch(/select a mood/i);
  });
});
