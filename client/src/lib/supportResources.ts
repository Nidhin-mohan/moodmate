import type { ToolsGroup } from "./moods";

/**
 * PLACEHOLDER helplines — sample data only, clearly labelled in the UI.
 * Replace with real, region-appropriate resources before relying on them.
 */
export const SAMPLE_HELPLINES = [
  { name: "Sample Helpline", contact: "000-000-0000", note: "Call · any time" },
  { name: "Sample Text Line", contact: "Text HELLO to 00000", note: "Text · any time" },
] as const;

export const TOOLS_GROUPS: Record<ToolsGroup, { title: string; blurb: string }> = {
  calm: { title: "I need calm now", blurb: "Slow your breathing and settle your body." },
  scattered: { title: "I feel scattered", blurb: "Come back to the present moment." },
  kind: { title: "I'm being hard on myself", blurb: "Offer yourself some kindness." },
};

/** Where the support nudge sends someone: the Tools group matching their mood. */
export const toolsGroupHref = (group: ToolsGroup | null) => `/tools${group ? `#${group}` : ""}`;
