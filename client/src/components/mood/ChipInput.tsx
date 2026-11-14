import { useId, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface ChipInputProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

/**
 * Type and press Enter (or comma) to add a chip; tap a suggestion to add it.
 * Duplicates are ignored case-insensitively, so "mom" and "Mom" stay one tag.
 */
export function ChipInput({ label, value, onChange, suggestions = [], placeholder }: ChipInputProps) {
  const [text, setText] = useState("");
  const id = useId();

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,+$/, "").trim();
    if (!tag) return;
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      setText("");
      return;
    }
    onChange([...value, tag]);
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const visibleSuggestions = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex min-h-[48px] flex-wrap items-center gap-2 rounded-2xl border border-input bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-soft py-1 pl-3 pr-1 text-sm text-soft-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              aria-label={`Remove ${tag}`}
              className="-my-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-background/40"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(text)}
          enterKeyHint="done"
          placeholder={value.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      {visibleSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2" aria-label={`Suggestions for ${label}`}>
          {visibleSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="min-h-[44px] rounded-full border border-dashed border-border px-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
