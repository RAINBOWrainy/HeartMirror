# HeartMirror Design System

> AI companion for 2AM spiraling — design system specification

## Core Design Principle

**Zero distraction. Calm space for untangling racing thoughts.**

Every design choice eliminates visual noise that would compete for the user's attention when they're anxious and spiraling at 2AM. Less UI = more mental space for the user.

---

## Aesthetic: Brutally Minimal

Type and whitespace only. No decoration.

**Rationale:** This product is about creating a safe, calm space for dumping racing thoughts. Any decoration competes for attention when the user needs to focus on untangling their own mind. Brutal minimalism serves the product.

---

## Color Palette (Night-Friendly Dark Mode)

**Approach:** Restrained — one accent on deep charcoal grays. Low contrast for night-adapted vision.

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0a0a0a` | Page background (near-black, not pure black — easier on eyes) |
| Surface | `#171717` | Sidebar, cards, chat bubbles container |
| Border | `#262626` | Subtle borders and dividers |
| Muted Text | `#78716c` | Secondary text, timestamps, hints |
| Default Text | `#e5e5e5` | Primary text — off-white, not pure white |
| Primary Accent | `#3b82f6` | Send button, active states, links (soft blue, low saturation) |
| Error/Danger | `#ef4444` | Errors, warning states (soft red) |
| Success | `#22c55e` | Success confirmations (soft green) |

**Rationale:**
- Pure black/pure white creates too much contrast and can shock your night-adapted vision
- The charcoal/soft gray palette maintains readability without glare
- The soft blue accent is calm and cool — matches the emotional tone of helping users de-escalate spiraling

**Key Decision:** Dark mode is **not** a toggle — it's the product. This is built for 2AM use first. No light mode toggle.

---

## Typography

### Font Stack

| Usage | Font | Rationale |
|-------|------|-----------|
| Display (conversation titles) | **Satoshi** | Modern grotesque, clean, neutral, highly legible at any size. Perfect for compact sidebar items. |
| Body (chat messages, input) | **Instrument Sans** | Excellent readability for long-form text, open apertures work well on screen, calm neutral character. |
| UI Labels | **Instrument Sans** | Consistent, no need for multiple font families. |

### Type Scale (4px base unit)

| Size | Rem | Pixels | Usage |
|------|-----|--------|-------|
| xs | 0.75rem | 12px | Secondary text, timestamps |
| sm | 0.875rem | 14px | UI labels, hints |
| base | 1rem | 16px | Body text, chat messages, input |
| lg | 1.125rem | 18px | Conversation titles |
| xl | 1.25rem | 20px | Modal headers |

### Font Weights

| Usage | Weight |
|-------|--------|
| Body | 400 |
| Medium emphasis | 500 |
| Headings | 600 |

### Line Height

- Body: 1.6 — comfortable for long-form reading at night
- Headings: 1.3
- UI compact: 1.4

### Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Satoshi:wght@400;500;600&display=swap');
```

---

## Spacing

**Base unit:** 4px  
**Density:** comfortable — generous spacing reduces cognitive load

| Scale | Pixels | Usage |
|-------|--------|-------|
| 2xs | 8px | tight spacing, icon padding |
| xs | 12px | internal card padding |
| sm | 16px | message bubbles padding |
| md | 24px | component spacing, sidebar item padding |
| lg | 32px | section spacing |
| xl | 40px | page padding |
| 2xl | 64px | large vertical spacing |
| 3xl | 80px | hero spacing |

**Rationale:** At 2AM, you don't want to squint or feel cramped. Comfortable generous spacing reduces cognitive load when the user is already anxious.

---

## Border Radius

Hierarchical radius — larger radii for larger containers that need to feel softer.

| Size | Pixels | Usage |
|------|--------|-------|
| sm | 4px | form inputs, buttons |
| md | 8px | conversation items in sidebar |
| lg | 16px | chat bubbles, modals, cards |
| full | 9999px | pill buttons, badges |

**Rationale:** Softer corners on chat bubbles feel less aggressive. Smaller radii for smaller UI elements maintain tighter alignment.

---

## Layout

**Structure:** Left sidebar (conversation list) + main content (chat area) — standard chat pattern users already know.

- **Sidebar:** Fixed width (280px) on desktop, collapsible to hamburger on mobile
- **Main chat area:** Fluid width, message list grows with content
- **Input area:** Fixed at bottom of main area
- **Maximum content width:** None — chat bubbles naturally constrain width to 65ch for optimal reading

**Grid Alignment:** Strict 4px-based alignment throughout. All spacing aligns to the base unit. Predictable spacing means predictable interaction — important when the user is anxious and needs to find controls without thinking.

---

## Border Radius

Hierarchical radius — larger radii for larger containers that need to feel softer.

| Size | Pixels | Usage |
|------|--------|-------|
| sm | 4px | form inputs, buttons |
| md | 8px | conversation items in sidebar |
| lg | 16px | chat bubbles, modals, cards |
| full | 9999px | pill buttons, badges |

---

## Motion & Animation

**Approach:** Minimal-functional — only transitions that aid comprehension.

- No "welcome" animations
- No parallax
- No gradients moving
- Only subtle state transitions

| Transition | Duration | Easing |
|------------|----------|--------|
| Interactive state changes (hover, focus) | 100ms | ease-out |
| Sidebar open/close (mobile) | 150ms | ease-out |
| Modal entrance/exit | 150ms | ease-out |

**Rationale:** Motion can be jarring when you're already anxious. Only animate what needs animation — keep it quick and subtle.

---

## Decoration

**Rule:** Typography does all the work. Only subtle gray-on-gray contrast for hierarchy.

No:
- Gradients
- Textures
- Patterns
- Abstract shapes/blobs
- Shadows (except subtle elevation for modals)
- Images/icons unless functionally necessary

**Rationale:** All decoration is visual noise. The user needs calm, not distraction. This is a deliberate departure from most AI mental health apps that use soft decorative imagery.

---

## Elevation & Shadows

Only one shadow level — for modals that float above content:

```css
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
```

No other shadows needed — we use border contrast for hierarchy instead.

---

## Interaction States

### Buttons

- **Default:** Accent background, muted text contrast
- **Hover:** Slightly lighter accent (10% increase in lightness)
- **Active/Pressed:** Slightly darker accent
- **Disabled:** 50% opacity

### Conversation Items (Sidebar)

- **Default:** Transparent, muted text for date
- **Hover:** Surface color (`#171717`) background
- **Active:** Surface color + left accent border (primary blue)

### Chat Bubbles

- **User message:** Right-aligned, accent background tint, white text
- **Assistant message:** Left-aligned, surface (`#171717`) background, default text

---

## Accessibility

- **Contrast ratio:** All text meets WCAG AA contrast (at least 4.5:1) on dark background
- **Focus rings:** Visible focus ring for keyboard navigation
- **Semantic HTML:** Proper `role`, `aria-label` for all interactive elements
- **Reduced motion:** `prefers-reduced-motion` media query disables all non-essential transitions

---

## Responsive Breakpoints

| Breakpoint | Sidebar | Layout |
|------------|---------|--------|
| `> 768px` | Fixed open, 280px | Sidebar + main |
| `<= 768px` | Collapsible hamburger | Full width chat when open |

---

## Design Decision Summary

Every choice reinforces the core product value: "calm zero-distraction space for when you're spiraling at 2AM."

| Decision | Why |
|----------|-----|
| Brutally minimal decoration | Eliminates visual noise — user focuses on their thoughts, not the UI |
| No light mode toggle | This product is built for 2AM. Less complexity. |
| Two-font stack | Subtle hierarchy without adding colors or decorations |
| Low-contrast charcoal palette | Easier on night-adapted vision — no glare when you're trying to get back to sleep |
| Standard left-sidebar layout | No learning curve — users already know how to use it |

---

## Implementation Notes for Tailwind

This design system maps cleanly to Tailwind. Extend the theme:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        base: {
          bg: '#0a0a0a',
          surface: '#171717',
          border: '#262626',
          muted: '#78716c',
          text: '#e5e5e5',
        },
        accent: {
          primary: '#3b82f6',
          error: '#ef4444',
          success: '#22c55e',
        }
      },
      fontFamily: {
        display: ['Satoshi', 'sans-serif'],
        sans: ['Instrument Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
      },
      spacing: {
        // Already follows 4px base in Tailwind
      }
    }
  }
}
```
