---
name: Duel Commander Validator
description: Validador de deck no estilo de página de produto da Apple, com vidro, claro e escuro.
colors:
  accent: "#0071e3"
  accent-hover-light: "#0077ed"
  accent-hover-dark: "#0a84ff"
  accent-text-light: "#0066cc"
  accent-text-dark: "#2997ff"
  ground-light: "#f5f5f7"
  ground-dark: "#000000"
  glass-light: "rgba(255, 255, 255, 0.72)"
  glass-dark: "rgba(28, 28, 30, 0.5)"
  glass-strong-light: "rgba(255, 255, 255, 0.76)"
  glass-strong-dark: "rgba(36, 36, 38, 0.72)"
  popover-light: "rgba(255, 255, 255, 0.92)"
  popover-dark: "rgba(44, 44, 46, 0.92)"
  field-light: "rgba(255, 255, 255, 0.86)"
  field-dark: "rgba(0, 0, 0, 0.38)"
  text-light: "#1d1d1f"
  text-dark: "#f5f5f7"
  text-secondary-light: "#6e6e73"
  text-secondary-dark: "#a1a1a6"
  text-display-muted: "#86868b"
  ambient-light: "rgba(0, 113, 227, 0.08)"
  ambient-dark: "rgba(10, 132, 255, 0.16)"
  green-light: "#248a3d"
  green-dark: "#30d158"
  red-light: "#d70015"
  red-dark: "#ff453a"
  orange-light: "#b25000"
  orange-dark: "#ff9f0a"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Inter, Segoe UI, sans-serif"
    fontSize: "80px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Inter, Segoe UI, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Inter, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Inter, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: "-0.022em"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Inter, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  mono:
    fontFamily: "ui-monospace, SF Mono, JetBrains Mono, Menlo, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "28px"
  pill: "980px"
spacing:
  gutter: "16px"
  gap: "12px"
  tile: "28px"
  composer: "32px"
  container: "1024px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 22px"
  button-primary-large:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "56px"
    padding: "0 32px"
  button-secondary:
    textColor: "{colors.accent-text-light}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 22px"
  glass-tile-light:
    backgroundColor: "{colors.glass-light}"
    rounded: "{rounded.xl}"
    padding: "{spacing.tile}"
  glass-tile-dark:
    backgroundColor: "{colors.glass-dark}"
    rounded: "{rounded.xl}"
    padding: "{spacing.tile}"
  text-input:
    backgroundColor: "{colors.field-light}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 16px 0 40px"
  status-badge:
    rounded: "{rounded.pill}"
    padding: "3px 9px"
    typography: "{typography.caption}"
---

# Design System: Duel Commander Validator

## Overview

The page reads like an Apple product page that happens to be a working tool. The verdict is the headline: after validation, "Deck válido" or "Deck inválido" is set at the same 80px as the hero, followed by one specific line ("3 cartas banidas, 1 não encontrada e 1 outro problema."). Everything else supports that verdict.

The material is frosted glass over a single soft field of light. The light exists only so the glass has something to refract: one blue radial glow, static (never animated, because every blurred surface would have to re-blur each frame). Light mode is a neutral `#f5f5f7` ground with white glass; dark mode is a black ground with a faint blue glow behind dark glass.

Color does jobs, not decoration. There is one action blue, and green, red and orange appear only as card state.

**Key characteristics**
- Frosted 52px global nav, two-tone headline, composer above the fold, one blue pill.
- Glass tiles with a hairline rim; in dark mode, a brighter top edge.
- iOS segmented controls with a sliding thumb.
- Cards grouped by type in both list and grid.
- Motion explains state: the theme reveal, the card morph and the drawn verdict icon.

## Colors

### Primary
- **Action Blue** (`#0071e3`): the only accent. It is used for primary buttons, focus rings (as a 32-40% alpha ring), links (`#0066cc` in light, `#2997ff` in dark) and the caret.

### Neutral
- **Ground**: `#f5f5f7` in light, `#000000` in dark, as the page background behind the ambient light.
- **Glass**: `rgba(255,255,255,.72)` in light and `rgba(28,28,30,.5)` in dark for tiles. The strong variant (`.76` / `.72`) is for the viewer and the stuck toolbar. Popovers use `.92` so they stay legible with nothing behind them.
- **Text**: `#1d1d1f` and `#f5f5f7` for primary text. Secondary is `#6e6e73` / `#a1a1a6`. `#86868b` is reserved for large display text (the muted second line of the hero), where 3:1 contrast is enough.

### Semantic (card state only)
- **Legal**: green (`#248a3d` / `#30d158`).
- **Banida**: red (`#d70015` / `#ff453a`).
- **Só no deck** (banned as commander): orange (`#b25000` / `#ff9f0a`).
- **Não encontrada**: secondary gray.

Badges use the state color on a 10-15% tint of the same hue.

### Named Rules
- **The One Blue Rule.** Blue means "you can act here". It never marks state or decoration.
- **The One Light Rule.** One ambient light, static. No second hue, no drifting gradients.
- **The No Glow Rule.** A banned card shows a crisp 2px red ring with a neutral shadow, never a colored bloom.

## Typography

One family: the system SF Pro stack, with Inter as the fallback off Apple devices. Monospace is used only in the decklist textarea, where alignment of quantities matters.

### Hierarchy
- **Display** (80px / 700 / -0.035em; 56px at ≤900px, 40px at ≤640px): the hero headline and the verdict.
- **Headline** (28px / 600): the verdict summary line.
- **Title** (24px / 600): field labels ("Comandante", "Decklist") and tile titles.
- **Group title** (19px / 600): type groups, with the copy count in tertiary gray.
- **Body** (17px / 1.47 / -0.022em; 16px on phones).
- **Caption** (13-14px): hints, legend, badges.
- **Numbers** use `tabular-nums` everywhere: stats, counts, quantities.

## Layout

- The container is `min(1024px, 100% - 32px)`, with a 16px gutter on phones.
- The composer is two columns (commander 0.85fr, decklist 1.5fr) and stacks at ≤900px.
- The stats strip is 4 columns, becoming 2×2 at ≤900px.
- The card list is two columns of hairline-separated rows, one column at ≤900px.
- The grid is `auto-fill, minmax(150px, 1fr)` (130px on phones), with 24px row and 16px column gaps.
- Vertical rhythm: the hero has 88px above and 56px below; tiles are 12px apart.
- Breakpoints: 900px and 640px.

## Elevation & Depth

Depth comes from glass, not stacking.
- **Glass tiles**: `backdrop-filter: saturate(180%) blur(28px)` (dark: `saturate(160%) blur(32px)`), a 1px rim, an inset top highlight, and a soft offset shadow (`0 20px 50px rgba(0,0,0,.06)`; dark `0 30px 80px rgba(0,0,0,.5)`).
- **Cards in the grid**: `0 6px 20px rgba(0,0,0,.14)`. On hover they lift 4px and scale 1.02.
- **Popover and viewer**: the pop shadow `0 12px 40px rgba(0,0,0,.14)`. The viewer's backdrop dims to 42% and blurs the page by 14px.

Every shadow has a vertical offset; there are no zero-offset halos.

## Shapes

- Radius 28px for large tiles (18px on phones), 18px for inner lists and the stuck toolbar, 12px for inputs and popovers, 8px for autocomplete rows.
- Pills (980px) for buttons and status badges. Segmented controls are 9px outside and 7px for the thumb.
- Card art keeps the physical card's corner, `4.8% / 3.5%`.

## Components

### Buttons
- **Primary pill**: blue, white label, 44px tall (56px for "Validar deck"). On hover it shifts to `#0077ed` / `#0a84ff`; when pressed it scales to 0.98; disabled is 45% opacity.
- **Secondary pill**: transparent with a blue outline and label, filling with blue on hover. Used for "Validar outro deck".
- **Text button**: a blue link-style action ("Usar exemplo"); "Limpar" is in secondary gray.

### Segmented control
A translucent track holds a thumb that slides under the active option (320ms, `--ease-out`). It is used for the filter ("Todas" / "Com problema") and for the view (list / grid icons). Counts sit inside the option; on the active option they use the primary text color.

### Glass tile
Composer, stats strip, problems, commander and cards panel. Inner lists sit on a slightly more opaque inner glass layer.

### Inputs
Translucent white (or 38% black in dark), a 1px border, and a 12px radius. Focus shows a blue border plus a 4px blue ring. The commander field has a search icon at 40px of left padding.

### Navigation
A 52px sticky bar with `saturate(180%) blur(20px)`. A hairline and more opacity appear only once the page scrolls. The brand sits on the left; the banlist date and the theme toggle sit on the right.

### Deck card (signature)
One markup renders both views.
- **List**: a row showing quantity, name and status badge. Hovering shows the card image as a floating tooltip (fine pointers only).
- **Grid**: the card art with a quantity badge for 2 or more copies. A shimmer skeleton shows while the image loads, then the art fades in from blur. Banned cards get a 2px red ring, banned-as-commander a 2px orange ring.
- Clicking opens the viewer dialog. From the grid, the art morphs into the dialog (View Transition `card-zoom`) and back on close or Esc.

### Verdict
A 64px circle, green or red, whose check or cross is drawn as a stroke (`pathLength="1"`, 500ms). Below it are the display-size verdict and one summary line. The status is announced through `role="status"`; the card list is not a live region.

## Motion

- **Easing**: `--ease` `cubic-bezier(0.25, 0.1, 0.25, 1)` for routine changes, and `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)` for arrivals.
- **Theme switch (focal moment)**: the new theme is revealed by a circle growing from the toggle over 650ms. Color transitions are suspended during the reveal; the sun/moon icon rotates in and out.
- **List ↔ grid and filter**: a 350ms View Transition (`deck-cards`). The toolbar stays live (`cards-toolbar`) so the thumb slides instead of cross-fading.
- **Feedback**: segmented thumb 320ms, image blur-in 450-600ms, verdict pop 600ms with the stroke drawn after 250ms.
- **Reduced motion**: movement is removed (no translate, scale, clip reveal or stroke draw); opacity and color changes remain. View Transitions shorten to 200ms.

## Do's and Don'ts

### Do:
- **Do** keep the verdict the largest thing on the results screen.
- **Do** give every count a unit that matches what it counts. "Problemas" equals the rows in the problem list; "Com problema" counts banned or not-found cards.
- **Do** keep the ambient light static and singular.
- **Do** theme browser surfaces: selection, caret, scrollbar and focus ring come from the palette.
- **Do** escape every Scryfall or user string before it reaches `innerHTML`.

### Don't:
- **Don't** add colored glows, gradient text, purple fields or neon accents. That is the "gamer dashboard" this design refuses.
- **Don't** put an eyebrow or kicker above a heading, or number the sections.
- **Don't** use emoji or Unicode glyphs as icons. Icons are inline SVG with a 1.8-2.4 stroke and round caps.
- **Don't** make the whole results section a live region, or announce card lists.
- **Don't** animate anything that sits under `backdrop-filter`.
