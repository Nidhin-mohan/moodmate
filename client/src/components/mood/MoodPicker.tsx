import { motion } from "framer-motion";
import { MOODS, type MoodName } from "@/lib/moods";
import { cn } from "@/lib/utils";
import { MoodFace } from "./MoodFace";

interface MoodPickerProps {
  onPick: (mood: MoodName) => void;
  disabled?: boolean;
  /** Six in a row on wide containers; 3×2 on narrow ones. */
  className?: string;
  selected?: string | null;
}

/** The six faces. Tapping one is the quick log. */
export function MoodPicker({ onPick, disabled, className, selected }: MoodPickerProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:grid-cols-6", className)}>
      {MOODS.map((m) => (
        <motion.button
          key={m}
          type="button"
          whileTap={{ scale: 0.94 }}
          disabled={disabled}
          onClick={() => onPick(m)}
          aria-pressed={selected ? selected === m : undefined}
          className={cn(
            "flex min-h-[44px] flex-col items-center gap-2 rounded-2xl bg-card/70 py-3 text-sm text-foreground transition-colors hover:bg-card disabled:opacity-60",
            selected === m && "bg-card ring-2 ring-primary"
          )}
        >
          <MoodFace mood={m} size={44} decorative />
          {m}
        </motion.button>
      ))}
    </div>
  );
}
