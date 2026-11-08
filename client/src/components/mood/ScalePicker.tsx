import { cn } from "@/lib/utils";

interface ScalePickerProps {
  label: string;
  min: number;
  max: number;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  lowLabel?: string;
  highLabel?: string;
}

/**
 * Large tappable numbers instead of a slider (sliders are fiddly on phones).
 * Tapping the selected number again clears it — "not answered" is allowed.
 */
export function ScalePicker({ label, min, max, value, onChange, lowLabel, highLabel }: ScalePickerProps) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  // Five per row: 1–5 fits one row, 1–10 fits two — large targets on phones.
  return (
    <div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-2">
        {values.map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${n}`}
              onClick={() => onChange(on ? undefined : n)}
              className={cn(
                "h-12 rounded-2xl text-lg font-medium transition-colors sm:h-14",
                on
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:bg-accent"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      {(lowLabel || highLabel) && (
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

interface ChoiceChipsProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}

/** Single-select chips; tap again to clear. */
export function ChoiceChips<T extends string>({ label, options, value, onChange }: ChoiceChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(on ? undefined : o.value)}
            className={cn(
              "min-h-[44px] rounded-full px-4 text-sm transition-colors",
              on
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground hover:bg-accent"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
