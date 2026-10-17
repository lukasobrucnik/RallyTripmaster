# Product

## Register

product

## Users

Rally co-drivers (and the owner, who competes). The user is harnessed into a bucket seat, phone clamped to the roll cage or dash, car hammering over gravel. He glances at the screen for roughly 0.4 seconds between road-book lines, then looks back at his notes. Conditions swing from flat overcast to low sun flaring across the glass to full dark with only dash glow. Gloves on. No time to aim at a small target, no patience for anything that has to be interpreted.

Secondary context: standing in the service park or at a time control, setting up, calibrating, or reading back a stage time.

## Product Purpose

A GPS tripmeter that replaces a dedicated rally computer with a phone. It measures distance from the start and distance from the last corner, times special stages, and lets the co-driver correct the reading by hand when the road book and the odometer disagree. Success is the co-driver trusting the number enough to call it out without double-checking, and never having to look at the screen for longer than a glance.

## Brand Personality

Instrument, not gadget. Three words: **precise, legible, unflinching.**

The reference world is the co-driver's own paperwork and equipment — time cards, road books, tulip diagrams, stamped time controls, marshal signal gear, cockpit instrument panels. Racing is present as *procedure and instrumentation*, not as speed styling. The tool states facts and gets out of the way.

## Anti-references

- **The first-order rally reflex**: carbon-fibre texture, checkered flags, speedometer gauge dials, italic "speed" typefaces, chrome and gloss. Instant costume-shop motorsport.
- **Black + racing orange + friendly rounded cards** — what this app looked like before this pass. Generic app chrome wearing a sports colour.
- **Neon gamer / crypto dark UI**: glowing fluoro everywhere, decorative glassmorphism, blurred panels.
- **The competitor tripmeters** (Tripmeter, Roadbook Studio and similar): big bold numbers on black with default grey system chrome around them and no point of view. Functional, but anonymous.

## Design Principles

1. **The number is the interface.** Distance and time are the product. Everything else is annotation and must visually yield to them.
2. **Colour is information, never decoration.** The hero numerals are white because white is the most legible thing on black. Chroma is reserved for state: armed, paused, over the limit, signal lost.
3. **Glance-readable beats feature-rich.** If an element doesn't survive a 0.4-second look at arm's length on a vibrating mount, it doesn't belong on the driving screens.
4. **Instruments have edges.** Hairline rules, flush panels and near-square corners over floating rounded cards. The form language is a printed time card and a machined panel, not a consumer app.
5. **Gestures over buttons, but never ambiguous gestures.** Large touch zones with stated behaviour and visible progress feedback — the co-driver is wearing gloves and cannot hunt for a 40px target.

## Accessibility & Inclusion

- Target WCAG 2.2 AA: body text ≥4.5:1, large numerals and labels ≥3:1, verified in both cockpit (dark) and daylight (light) themes.
- State is never carried by hue alone — paused also shows a hazard band and a text flag; GPS health shows a word, not just a coloured dot. Works for red/green colour blindness.
- `prefers-reduced-motion` is fully honoured: the hazard band stops crawling, transitions collapse to instant. No information is lost when motion is off.
- Touch targets ≥56px for gloved hands; the primary reset zones are deliberately far larger.
- Both themes are first-class. Daylight mode is a genuine sunlight-legibility mode, not a light-theme afterthought.
