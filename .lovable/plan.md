## Plan: Hero Background Visibility Adjustment

### Goal
On `HomePage.tsx` hero section, keep the background image fully visible where there's no text, and only darken/overlay the area behind the text for readability.

### Current behavior
The hero uses a full-width gradient overlay (`from-background/95 via-background/80 to-background/60`) covering the entire image, which dims the whole picture — including empty areas on the right.

### Changes (in `src/pages/HomePage.tsx`, hero section only)

1. **Remove the full-width gradient overlay** that currently dims the entire image.
2. **Scope the dark overlay to the text area only**:
   - Wrap the text content (headline, description, CTAs) in a container limited to ~max-w-2xl on the left.
   - Apply a localized backdrop behind just that text block using one of:
     - A soft radial/linear gradient that fades from `background/85` on the left to fully transparent before the midpoint, OR
     - A `backdrop-blur-sm` + `bg-background/60` panel sized to the text block with soft edges (rounded + mask-image fade) so it doesn't look like a hard card.
3. **Stats card** already sits on its own `bg-card/80 backdrop-blur` panel — leave it as-is since it has its own readable surface.
4. Ensure right side (where no text sits at md+ breakpoints) shows the image at 100% opacity with no overlay.
5. On mobile (where text spans full width), keep a subtle full-width darken so text stays legible.

### Technical notes
- Use Tailwind semantic tokens (`bg-background/XX`) — no raw colors.
- Use a responsive approach: full overlay on `sm` and below, left-only gradient at `md+`.
- Example overlay replacement:
  ```
  md:bg-gradient-to-r md:from-background/90 md:via-background/50 md:to-transparent
  bg-background/60  // mobile fallback
  ```
- No changes to other sections, no business logic touched.
