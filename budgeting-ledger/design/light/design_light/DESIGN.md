# Design System Specification: The Organic Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Organic Editorial."** 

We are moving away from the rigid, "boxy" nature of standard SaaS platforms toward a layout that feels curated, breathing, and tactile. By combining the geometric precision of *Plus Jakarta Sans* with a fluid, "no-line" philosophy, we create an experience that is both technologically advanced and humanly approachable. 

The system leverages intentional asymmetry and deep "tonal layering" to guide the eye. Instead of using borders to cage content, we use the natural tension between whitespace and soft surface shifts to define structure. This is not just a light theme; it is a premium digital environment designed to feel as fresh as mint and as warm as honey.

---

## 2. Colors: Tonal Depth & The No-Line Rule
Our palette is a sophisticated interplay of cool, refreshing teals and sun-drenched accents, grounded by a slate-tinted off-white.

### The Palette (Material 3 Logic)
*   **Primary (Teal/Mint):** `#006b5f` (Primary) | `#16b8a6` (Container)
*   **Secondary (Coral):** `#a43c12` (Secondary) | `#fe7e4f` (Container)
*   **Tertiary (Honey):** `#705d00` (Tertiary) | `#c1a200` (Container)
*   **Neutral (Slate/Off-White):** `#f6fafe` (Surface) | `#171c1f` (On-Surface)

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning or containment. 
Structure must be achieved through:
1.  **Background Shifts:** Use `surface-container-low` (`#f0f4f8`) for sections and `surface-container-lowest` (`#ffffff`) for elevated content cards.
2.  **Negative Space:** Utilize the Spacing Scale (specifically `8` to `16`) to create "rivers" of air that naturally separate concepts.

### Glass & Gradient Signature
To elevate the UI beyond a flat kit:
*   **Signature Gradients:** For primary CTAs and Hero backgrounds, use a linear gradient from `primary` to `primary_container` at a 135° angle. This adds "visual soul."
*   **Glassmorphism:** For floating navigation or modals, use `surface` at 80% opacity with a `24px` backdrop-blur. This ensures the layout feels integrated, not "pasted on."

---

## 3. Typography: The Editorial Voice
We use **Plus Jakarta Sans** exclusively. Its high x-height and modern curves provide the perfect balance between professional and friendly.

*   **Display (Display-LG: 3.5rem):** Reserved for high-impact brand moments. Use `tight` letter-spacing (-0.02em) to create an authoritative, editorial feel.
*   **Headlines (Headline-MD: 1.75rem):** Use these to tell a story. Pair with `primary` color accents for key verbs.
*   **Body (Body-LG: 1rem):** The workhorse. Always use `on-surface-variant` (`#3c4947`) for long-form reading to reduce eye strain and increase the "premium" feel.
*   **Labels (Label-MD: 0.75rem):** All-caps with `+0.05em` tracking for a utilitarian, "tagged" aesthetic.

---

## 4. Elevation & Depth: The Layering Principle
We reject the 2010s "drop shadow." We achieve height through **Tonal Layering.**

### Stacking Tiers
Imagine the UI as sheets of fine paper. 
*   **Base Layer:** `surface` (`#f6fafe`)
*   **Section Layer:** `surface-container-low` (`#f0f4f8`)
*   **Interactive Layer:** `surface-container-lowest` (`#ffffff`)

### Ambient Shadows
When a component must "float" (e.g., a dropdown or a primary card), use an **Ambient Shadow**:
*   **Color:** `on-surface` (`#171c1f`) at 6% opacity.
*   **Blur:** `32px` to `48px`.
*   **Offset:** Y: `8px`.
This mimics soft, natural light rather than a digital effect.

### The "Ghost Border" Fallback
If contrast testing requires a boundary, use a **Ghost Border**: `outline-variant` (`#bbcac6`) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Soft & Purposeful

### Buttons (The "Full Round" Signature)
*   **Primary:** Gradient fill (`primary` to `primary_container`), `full` (9999px) roundness, white text. No shadow.
*   **Secondary:** `secondary_container` fill. Used for "supportive" actions that need a pop of Coral warmth.
*   **Tertiary:** Ghost style. No fill, no border. Just `primary` colored text with a `surface_container_high` hover state.

### Cards & Containers
*   **Rule:** Forbid divider lines. Use `spacing-6` (1.5rem) as the minimum internal padding.
*   **The "Mint" Edge:** For featured cards, use a 4px left-accent bar in `primary_fixed` to provide a "hint" of color without overwhelming the clean slate background.

### Inputs & Fields
*   **Style:** `surface_container_highest` fill with a `full` roundness scale for short fields, or `md` (1.5rem) for text areas.
*   **Focus State:** Shift the background to `surface_container_lowest` and apply a 2px `primary` ghost border (20% opacity).

### Signature Component: The "Honey" Pulse
*   **Context:** Use for status indicators or new notifications.
*   **Style:** A small circle in `tertiary` (`#705d00`) with a soft, expanding glow using `tertiary_container`. It brings warmth and "honey-like" life to the clean teal interface.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use `9999px` (Full) roundness for buttons and tags to maintain the "approachable" vibe.
*   **Do** use asymmetric spacing (e.g., more padding at the top of a section than the bottom) to create a sense of movement.
*   **Do** utilize `surface_tint` at very low opacities (3-5%) for large background areas to keep the "light slate" feeling cohesive.

### Don’t
*   **Don’t** use black (`#000000`) for text. Always use `on-surface` to maintain the soft editorial tone.
*   **Don’t** use 1px dividers to separate list items. Use a `0.5rem` vertical gap and a subtle background color shift on hover.
*   **Don’t** use harsh, high-contrast shadows. If the shadow is the first thing you notice, it’s too dark.