import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Tools from "./Tools";

const renderTools = (url = "/tools") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Tools />
    </MemoryRouter>
  );

describe("Tools", () => {
  it("groups exercises by how you feel, keeping all six", () => {
    renderTools();

    const calm = screen.getByRole("region", { name: "I need calm now" });
    const scattered = screen.getByRole("region", { name: "I feel scattered" });
    const kind = screen.getByRole("region", { name: "I'm being hard on myself" });

    expect(within(calm).getByRole("button", { name: /physiological sigh/i })).toBeInTheDocument();
    expect(within(calm).getByRole("button", { name: /box breathing/i })).toBeInTheDocument();
    expect(within(scattered).getByRole("button", { name: /5-4-3-2-1 grounding/i })).toBeInTheDocument();
    expect(within(scattered).getByRole("button", { name: /mindful moment/i })).toBeInTheDocument();
    expect(within(kind).getByRole("button", { name: /self-compassion break/i })).toBeInTheDocument();
    expect(within(kind).getByRole("button", { name: /quick body scan/i })).toBeInTheDocument();
  });

  it("has groups addressable by the support nudge's links", () => {
    renderTools("/tools#calm");

    expect(document.getElementById("calm")).not.toBeNull();
    expect(document.getElementById("scattered")).not.toBeNull();
    expect(document.getElementById("kind")).not.toBeNull();
  });

  it("offers support with helplines clearly labelled as sample data", () => {
    renderTools();

    const support = screen.getByRole("region", { name: "Need support?" });
    expect(within(support).getByText(/sample data/i)).toBeInTheDocument();
    expect(within(support).getByText(/placeholders, not real services/i)).toBeInTheDocument();
  });

  it("opens an exercise on its own screen and comes back", async () => {
    renderTools();

    await userEvent.click(screen.getByRole("button", { name: /box breathing/i }));
    expect(screen.getByRole("dialog", { name: "Box Breathing" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /back to tools/i }));
    expect(screen.getByRole("region", { name: "I need calm now" })).toBeInTheDocument();
  });
});
