# MoodMate Style Guide

## Architecture

All visual tokens are defined as CSS custom properties in `src/index.css` and
exposed as Tailwind utility classes via `tailwind.config.js`. **Never hardcode
a color value in a component.** To restyle the entire app, edit only
`src/index.css`.

---

## Color Tokens

### Semantic palette

| Token | Tailwind class | Light | Dark | When to use |
|---|---|---|---|---|
| `--background` | `bg-background` | 210 20% 98% (subtle warm gray) | 222 22% 8% (rich navy) | Page canvas, full-bleed sections |
| `--foreground` | `text-foreground` | 222 47% 11% (deep navy) | 210 20% 94% (near white) | All headings and primary body text |
| `--card` | `bg-card` | 0 0% 100% (pure white) | 222 22% 12% | Card surfaces, modal backgrounds |
| `--muted` | `bg-muted` | 210 20% 94% | 222 22% 17% | Input fills, chip/badge backgrounds, section insets |
| `--muted-foreground` | `text-muted-foreground` | 215 16% 47% | 215 16% 58% | Labels, captions, secondary text, placeholder-style hints |
| `--primary` | `bg-primary` / `text-primary` | 174 60% 35% (teal) | 174 55% 46% | CTAs, active nav links, focus rings, brand accents |
| `--primary-foreground` | `text-primary-foreground` | 0 0% 100% (white) | 222 22% 8% | Text/icons on `bg-primary` |
| `--accent` | `bg-accent` | 174 60% 95% (light teal tint) | 174 55% 12% | Active pill labels, selected states that need color without high contrast |
| `--accent-foreground` | `text-accent-foreground` | 174 60% 28% | 174 55% 60% | Text on `bg-accent` |
| `--border` | `border-border` | 215 20% 89% | 222 22% 20% | All card borders, dividers, input outlines |
| `--destructive` | `text-destructive` / `bg-destructive/10` | 0 84% 60% (red) | 0 62% 38% | Logout, error states, delete actions |

### Semantic (non-brand) colors kept in components

These carry specific meaning and are intentionally not tokenised:

- **Mood dot colors** — `bg-green-500`, `bg-yellow-500`, `bg-blue-500`, `bg-purple-500`, `bg-red-500` — correspond directly to mood emotions; changing them would confuse users
- **Stat card icon backgrounds** — orange (intensity), teal/accent (mood), blue (activity) — signal metric type
- **People/Places/Events tag pills** — blue, purple, amber respectively — distinguish tag categories
- **Tool gradients** in `Tools.tsx` — each tool has its own gradient to create visual identity within the tool page

---

## Typography

| Use | Classes |
|---|---|
| Page heading | `text-2xl font-bold text-foreground` |
| Section heading | `text-base font-semibold text-foreground` |
| Body / paragraph | `text-sm text-foreground` or `text-sm text-muted-foreground` |
| Label (above input) | `text-sm font-medium text-muted-foreground` |
| Caption / timestamp / badge | `text-xs text-muted-foreground` |
| Brand name | `text-primary font-bold` |

No new font imports — the app uses the system font stack defined by Tailwind.

---

## Spacing

| Context | Value |
|---|---|
| Page horizontal padding | `px-4 sm:px-6` |
| Page vertical padding | `py-8` |
| Section card padding | `p-6` |
| Card content gap | `space-y-4` or `gap-4` |
| Form section gap | `space-y-6` |
| Inline icon-to-text gap | `gap-2` |
| Grid gutters | `gap-4` (tight), `gap-6` (standard) |

---

## Component Conventions

### Cards

```
bg-card border border-border rounded-xl shadow-sm          ← list item cards
bg-card border border-border rounded-2xl shadow-sm         ← feature/stat cards
```

On hover, prefer `hover:border-primary/30` rather than a background change —
it communicates interactivity without visual noise.

### Buttons

```
bg-primary hover:bg-primary/90 text-primary-foreground     ← primary CTA
variant="ghost" text-muted-foreground hover:text-primary   ← secondary/nav action
variant="ghost" text-destructive hover:bg-destructive/10   ← destructive action
variant="outline" border-border text-muted-foreground      ← tertiary/outline
```

Never use hardcoded `bg-teal-600` — always `bg-primary`.

### Form inputs

```
bg-muted border-border focus-visible:ring-ring             ← standard input fill
```

The shadcn `Input` and `Textarea` components pick up the ring color from
`--ring` automatically.

### Pills / badges

```
bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs   ← brand teal (social, active)
bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs     ← neutral (trigger, meta)
```

Semantic tag colors (blue/purple/amber for people/places/events) remain as-is.

### Selected / active states

Interactive selectors (mood buttons, trigger chips, social quality buttons) use:
- **Selected**: `bg-foreground text-background` for pill-style toggles
- **Selected with color**: the mood card's own `bg` + `border` + `ring-2 ring-primary/30`

---

## Dark Mode

Dark mode is toggled via the `dark` class on `<html>` (Tailwind `class` strategy,
managed by `ThemeContext`). All dark variants are defined inside `.dark {}` in
`src/index.css` — components do not need `dark:` prefixes for token-based classes.

The dark background (`222 22% 8%`) and dark card (`222 22% 12%`) are intentionally
different so surfaces have visible depth without relying on borders alone.

**Rule**: if you find yourself writing `dark:bg-slate-800` or `dark:text-slate-100`,
stop and use `bg-card` / `text-foreground` instead.

---

## Adding a New Route / Page

1. Add entry to `src/routes/routes.json`
2. Register lazy import in `src/routes/componentMap.ts`
3. Follow the page shell pattern:

```tsx
<div className="min-h-screen bg-background">
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
    <h1 className="text-2xl font-bold text-foreground mb-6">Page Title</h1>
    {/* content */}
  </div>
</div>
```

Use `max-w-3xl` for single-column forms, `max-w-7xl` for dashboard-style layouts.
