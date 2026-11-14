import { moodColors, resolveMood, type MoodName } from "@/lib/moods";
import { useTheme } from "@/context/ThemeContext";

// Face geometry validated in the prototype (branch prototype/redesign).
const FEATURES: Record<MoodName | "other", JSX.Element> = {
  Happy: (
    <>
      <path d="M14.5 21.5q3-3.5 6 0M27.5 21.5q3-3.5 6 0" />
      <path d="M15 28.5q9 9 18 0" />
    </>
  ),
  Excited: (
    <>
      <circle cx="18" cy="20" r="2" fill="currentColor" stroke="none" />
      <circle cx="30" cy="20" r="2" fill="currentColor" stroke="none" />
      <path d="M16 27.5h16q-1 9-8 9t-8-9z" fill="currentColor" />
    </>
  ),
  Neutral: (
    <>
      <circle cx="18" cy="21" r="2" fill="currentColor" stroke="none" />
      <circle cx="30" cy="21" r="2" fill="currentColor" stroke="none" />
      <path d="M18 31h12" />
    </>
  ),
  Sad: (
    <>
      <path d="M14 18.5l5-2M34 18.5l-5-2" />
      <circle cx="18" cy="23" r="2" fill="currentColor" stroke="none" />
      <circle cx="30" cy="23" r="2" fill="currentColor" stroke="none" />
      <path d="M17.5 34q6.5-5.5 13 0" />
    </>
  ),
  Anxious: (
    <>
      <path d="M14 18q3-3 6-2M34 18q-3-3-6-2" />
      <circle cx="18" cy="22.5" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="30" cy="22.5" r="2.3" fill="currentColor" stroke="none" />
      <path d="M16 32q2-2 4 0t4 0t4 0t4 0" />
    </>
  ),
  Angry: (
    <>
      <path d="M14 16.5l6 3M34 16.5l-6 3" />
      <circle cx="18" cy="23" r="2" fill="currentColor" stroke="none" />
      <circle cx="30" cy="23" r="2" fill="currentColor" stroke="none" />
      <path d="M18 33.5q6-3.5 12 0" />
    </>
  ),
  // Fallback for moods outside the six (legacy "calm", "tired"…): soft and neutral.
  other: (
    <>
      <circle cx="18" cy="22" r="2" fill="currentColor" stroke="none" />
      <circle cx="30" cy="22" r="2" fill="currentColor" stroke="none" />
      <path d="M19 31q5 2 10 0" />
    </>
  ),
};

interface MoodFaceProps {
  mood: string;
  size?: number;
  className?: string;
  /** Set when a visible label sits next to the face, so screen readers don't hear it twice. */
  decorative?: boolean;
}

export function MoodFace({ mood, size = 48, className, decorative = false }: MoodFaceProps) {
  const { theme } = useTheme();
  const info = resolveMood(mood);
  const { tint, ink } = moodColors(mood, theme);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      style={{ color: ink }}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": info.label })}
    >
      <path
        d="M24 3.5c11.5 0 20.5 8.8 20.5 20.8S35.8 44.5 24 44.5 3.5 36 3.5 24.2 12.5 3.5 24 3.5z"
        fill={tint}
        stroke="none"
      />
      {FEATURES[info.key]}
    </svg>
  );
}

/** A small filled dot in the mood's colour (strips, legends, journal). */
export function MoodDot({ mood, className = "h-3 w-3" }: { mood: string; className?: string }) {
  const { theme } = useTheme();
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ background: moodColors(mood, theme).tint }}
    />
  );
}
