# Design System Specification: Luminous Depth & Clarity

## 1. Overview & Creative North Star: "The Digital Sanctuary"
The Creative North Star for this design system is **"The Digital Sanctuary."** Moving away from literal metaphors, we are building an environment that feels like a high-end, dimly lit boutique—quiet, premium, and intensely legible. 

To break the "template" look, we reject the rigid, boxy constraints of standard web design. We embrace **Intentional Asymmetry** (e.g., placing a `display-lg` headline off-center against a floating glass container) and **Tonal Depth**. By utilizing the `ROUND_FULL` (9999px) radius extensively, we transform sharp digital interfaces into organic, pill-shaped vessels that feel soft to the touch and friendly to the eye.

---

## 2. Color & Surface Architecture
We move beyond flat backgrounds. Our palette uses a deep, warm charcoal (`#0d131f`) as a canvas for high-chroma accents.

### The "No-Line" Rule
**Explicit Instruction:** Junior designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be achieved through:
1.  **Background Shifts:** Transitioning from `surface` (#0d131f) to `surface-container-low` (#161c27).
2.  **Vertical Breathing Room:** Utilizing the Spacing Scale (specifically `8` to `16` units) to let content define its own territory.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-translucent materials.
- **Base Layer:** `surface` (#0d131f).
- **Secondary Sectioning:** `surface-container-low` (#161c27).
- **Interactive Cards:** `surface-container` (#1a202c) or `surface-container-high` (#242a36).
- **Floating Modals/Popovers:** `surface-container-highest` (#2f3542) with a backdrop blur.

### Signature Textures & Glass
To provide "soul," primary CTAs should not be flat. Use a subtle linear gradient:
*   **CTA Gradient:** `primary-container` (#4fd1c5) to `primary` (#6feee1) at a 135-degree angle.
*   **The Glass Rule:** For floating navigation or headers, use `surface-bright` (#333946) at 60% opacity with a `blur(20px)` effect to allow the background warmth to bleed through.

---

## 3. Typography: Editorial Warmth
We use **Plus Jakarta Sans** for its modern, geometric clarity and friendly apertures.

*   **Display Scale (`display-lg` to `display-sm`):** These are your "Hero" moments. Use `-0.04em` letter spacing to create a tight, editorial feel. These should be treated as graphic elements, often paired with wide-open white space.
*   **Headline & Title:** Use `headline-md` for section starters. Pair these with `on-surface-variant` (#bbc9c7) body text to create a sophisticated, low-contrast secondary hierarchy that reduces eye strain.
*   **Body & Labels:** `body-md` is the workhorse. Ensure a line-height of at least 1.5x to maintain the "Friendly & Clear" promise.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "dirty" for this system. We use **Tonal Layering**.

*   **The Layering Principle:** To lift a card, don't add a shadow; change the token. Place a `surface-container-highest` card inside a `surface-container-low` section. The contrast in value creates a natural, "soft lift."
*   **Ambient Shadows:** If a floating effect is required (e.g., a pill-shaped FAB), use a shadow color tinted with the `primary` hue: `rgba(111, 238, 225, 0.08)` with a `48px` blur.
*   **The Ghost Border Fallback:** If a container sits on a background of the same color, use a "Ghost Border": `outline-variant` (#3c4947) at 20% opacity. Never use 100% opaque lines.

---

## 5. Components & Primitive Styling

### Buttons
*   **Primary:** Pill-shaped (`rounded-full`). Gradient of `primary-container` to `primary`. Text color: `on-primary` (#003733).
*   **Secondary:** Ghost style. No background, `outline` (#869491) at 30% opacity, text in `primary`.
*   **Tertiary:** Text-only in `secondary` (#ffb866) for high-warmth calls to action that aren't the primary goal.

### Cards & Lists
*   **Rule:** Forbid divider lines.
*   **Implementation:** Separate list items using `surface-container-low` backgrounds with a `1rem` margin between items. Use the `ROUND_DEFAULT` (1rem) for content cards, but `ROUND_FULL` for the containers holding them to maintain the "pill" aesthetic.

### Input Fields
*   **Styling:** Use `surface-container-highest` for the field background. No bottom border. Use a `2px` focus ring of `primary` (#6feee1) that only appears on interaction. Labels must use `label-md` in `on-surface-variant`.

### Selection Chips
*   **Interaction:** Unselected chips use `surface-container-high`. Selected chips transition to `primary` with `on-primary` text. Always use `rounded-full`.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., `margin-left: 24` / `margin-right: 12`) to create a bespoke, custom feel in hero sections.
*   **Do** use `tertiary-container` (#ffa2c5) for soft, high-end "Special Notification" states rather than harsh reds.
*   **Do** lean into the "Plus Jakarta Sans" bold weights for `title-lg` to ensure authority.

### Don't:
*   **Don't** use pure black (#000000). It kills the "warm charcoal" depth of the system.
*   **Don't** use 1px dividers. If you feel the need to separate, use a `2rem` (spacing 8) gap instead.
*   **Don't** use sharp corners. Every interactive element should have at least a `DEFAULT` (1rem) radius, ideally `full`.