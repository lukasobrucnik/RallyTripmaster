# Design

Visual system for RallyTrip. Strategy and principles live in [PRODUCT.md](PRODUCT.md).

## Theme

**Dark-first ("cockpit"), with a true daylight mode.** Dark is not a style choice here: the app is used at night with only dash glow, and a near-black ground on OLED minimizes both glare off the glass and eye adaptation when looking back to the road. Daylight mode is a genuine sunlight-legibility mode — near-white ground, near-black numerals — not a courtesy light theme.

Theme is set via `:root[data-theme='dark'|'light']` from the settings store, with `color-scheme` following it.

## Color

Strategy: **Restrained.** Tinted near-neutrals carry every surface; one accent carries state only.

The hero numerals are **near-white, zero chroma**. The category reflex is a large orange number; inverting that is both a position and a legibility win — nothing beats white on near-black for a 0.4-second glance.

All values are OKLCH. Neutrals carry a faint cool cast (chroma ≤ 0.014, hue 250) so the surfaces read as machined metal rather than as pure grey.

### Cockpit (dark, default)

| Token | Value | Role |
|---|---|---|
| `--bg` | `oklch(0.14 0.008 250)` | App ground |
| `--surface` | `oklch(0.185 0.010 250)` | Data frame, strip, nav |
| `--surface-2` | `oklch(0.245 0.012 250)` | Raised control (buttons, inputs) |
| `--surface-3` | `oklch(0.30 0.013 250)` | Control hover / pressed |
| `--line` | `oklch(0.33 0.014 250)` | Hairline rules, borders |
| `--line-strong` | `oklch(0.44 0.016 250)` | Emphasised division |
| `--ink` | `oklch(0.97 0.002 250)` | Hero numerals, primary text |
| `--ink-dim` | `oklch(0.76 0.010 250)` | Field labels, secondary text |
| `--ink-faint` | `oklch(0.62 0.012 250)` | Annotations, hints |

### Signal (state only, both themes)

| Token | Dark | Light | Role |
|---|---|---|---|
| `--signal` | `oklch(0.86 0.17 118)` | `oklch(0.45 0.14 118)` | Armed / running / active selection |
| `--caution` | `oklch(0.82 0.16 85)` | `oklch(0.50 0.13 70)` | Paused, degraded signal |
| `--alert` | `oklch(0.68 0.20 27)` | `oklch(0.50 0.20 27)` | Limit breach, destructive |

`--signal` is a marshal-bib / course-marker fluoro yellow-green — authentic to rally marshalling, maximally luminous on near-black, and it holds up in direct sun where a cyan would wash out. It is deliberately **not** sportscar orange and **not** instrument amber, both of which are the reflex answers for this category.

Usage rule: signal colours appear on indicator blocks, hairline bands, progress rules and active controls. They never fill a large area and never colour a hero numeral.

## Typography

**One family: Archivo**, self-hosted as a variable woff2 (`weight 100–900`, `width 62.5–125%`), latin + latin-ext subsets for Czech diacritics. Self-hosted rather than CDN-linked because the app must work with no signal at all.

Archivo is a signage/high-performance grotesque — technical rather than sporty, with open counters and unambiguous digits. Width, not a second family, provides the contrast axis.

| Role | Spec |
|---|---|
| Hero numerals | Archivo, `wght 800`, `wdth 112%`, `-0.03em`, `tabular-nums`, container-scaled |
| Stage clock | Archivo, `wght 700`, `wdth 105%`, `tabular-nums` |
| Field label | `0.6875rem`, `wght 650`, `0.16em` tracking, uppercase, `--ink-dim` |
| UI / controls | `0.9375rem`, `wght 650` |
| Body / annotation | `0.8125rem`, `wght 450`, `--ink-faint` |

Fixed rem scale (ratio ≈1.2) for all UI text — product UI is viewed at consistent DPI and fluid labels look worse, not better. The **hero numerals are the deliberate exception**: they are the content, like a clock app's time, and must fill the frame they sit in.

Their size comes from a container query on the field itself, not from the viewport:

```css
font-size: calc(max(1.75rem, min(142cqw / var(--chars, 4), 66cqh)) * var(--vscale, 1));
```

`--chars` is set by the component from the rendered string (digits count as 1, a decimal point as 0.45, plus allowance for the unit suffix), so the width term fits any value — `0.00` fills the frame while `104.825` steps down instead of overflowing. `66cqh` caps it by the field's height, and `max(1.75rem, …)` guarantees the number can never collapse to invisible if the field's height degenerates. This replaces viewport `clamp()`s entirely and adapts to portrait, landscape and any screen with no media queries.

Every numeric output carries `font-variant-numeric: tabular-nums` so digits hold their position while counting. On a vibrating mount, a reflowing number is unreadable.

## Form language

- **`--radius: 3px`.** Instruments have edges. Floating 14px rounded cards were the single biggest "generic app" tell in the previous design.
- **Ruled fields, not stacked cards.** Data fields are divided by hairline rules and sit flush inside one frame, like fields on a printed time card. Nested cards are never used.
- Field labels sit above their value, small and letterspaced, with the value's baseline doing the visual work.
- **Hazard diagonals are a state, never decoration.** A 4px diagonal caution band appears on the data frame only while the trip is paused — an authentic motorsport signal that is also informative. It crawls slowly while paused and is static under reduced motion.

## Layout

- App shell: instrument strip (GPS health) → content → tab nav. Strip and nav are flush, hairline-separated, with safe-area insets.
- The Trip screen is fixed to the viewport and never scrolls; its fields split the available height. RZ and Settings scroll normally.
- Landscape is structural, not just smaller: the two Trip readouts move side by side and numerals scale from viewport height instead of width.
- Touch targets: `--tap: 60px` minimum for gloved hands; the Trip reset zone is the entire data frame.

## Motion

- 160–220 ms, `--ease: cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo). State changes only — no entrance choreography, no decorative movement.
- Hold-to-reset renders a progress rule that fills along the bottom edge of the press zone via `transform: scaleX()`, plus a haptic pulse on completion.
- **Digits never animate.** Counting numerals must not tween, blur or slide.
- `prefers-reduced-motion: reduce` stops the hazard crawl and collapses transitions to instant; no state becomes invisible.

## Z-index scale

`--z-strip: 10` → `--z-nav: 20` → `--z-backdrop: 40` → `--z-sheet: 50`. No arbitrary values.
