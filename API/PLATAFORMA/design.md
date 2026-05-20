# SMARTUR Design System

**Canonical product UI spec for PLATAFORMA.** Agents and skills must follow this file first, then [.agents/AGENTS.md](.agents/AGENTS.md) for skill routing.

| Layer | Source |
| ----- | ------ |
| Tokens & components | This file (`design.md`) |
| Motion philosophy | [emil-design-eng](.agents/skills/emil-design-eng/SKILL.md) (within § Motion below) |
| JS animation code | [GSAP](.agents/skills/gsap-react/SKILL.md) — not Framer Motion by default |

## Design Principles
- Swiss Style foundation: modular grid, restrained color, bold typography.
- Minimalist UI with high contrast and generous whitespace.
- Motion is purposeful and subtle; prefers reduced motion.

## Typography
- Heading: "Cal Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Body: "Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Monospace: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", "Courier New", monospace

### Type Scale (base 16px)
- Display: 72 / 80 / 96
- H1: 48 / 56
- H2: 36 / 44
- H3: 28 / 36
- H4: 22 / 30
- Body: 16 / 24
- Small: 14 / 20
- Caption: 12 / 16

## Colors

### Brand
- Pink: #FC478E
- Purple: #984EFD
- Cyan: #4DB9CA
- Green: #9CCC44
- Orange: #FF7D1F

### Semantic
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444
- Info: #3B82F6

### Neutral (Light)
- Background: #FFFFFF
- Surface: #F5F5FA
- Text: #1E1E23
- Muted Text: #50505A
- Border: rgba(0, 0, 0, 0.08)

### Neutral (Dark)
- Background: #0F1419
- Surface: #1A1D23
- Text: #E8E8F0
- Muted Text: #A0A0AA
- Border: rgba(255, 255, 255, 0.1)

### Contrast Guidance (WCAG AA)
- Body text on light: minimum 4.5:1
- Body text on dark: minimum 4.5:1
- Large text (>= 18px): minimum 3:1
- UI elements and icons: minimum 3:1

## Spacing
- Base grid: 8px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128

## Radius
- Small: 6
- Medium: 10
- Large: 16
- Full: 9999

## Shadows
- Small: 0 1px 2px rgba(0,0,0,0.05)
- Medium: 0 4px 6px -1px rgba(0,0,0,0.1)
- Large: 0 10px 15px -3px rgba(0,0,0,0.1)

## Motion

**Stack:** Apply [emil-design-eng](.agents/skills/emil-design-eng/SKILL.md) for *whether* and *how* to animate; implement with CSS/Tailwind or **GSAP** per [.agents/AGENTS.md](.agents/AGENTS.md).

### Tokens (baseline)
- Easing (default UI): `cubic-bezier(0.215, 0.61, 0.355, 1)` — prefer **ease-out** feel for enters/exits (see emil-design-eng for refinements)
- Duration scale: **150ms** (micro) / **300ms** (standard UI) / **500ms** (modals, large surfaces)
- UI interactions should stay **≤ 300ms** unless emil-design-eng justifies longer (e.g. rare onboarding)
- **Reduced motion:** respect `prefers-reduced-motion`; disable non-essential transform motion; keep opacity/color where they aid comprehension (GSAP: `gsap.matchMedia()`)

### Implementation
| Need | Tool |
| ---- | ---- |
| Hover, press, focus, simple fades | CSS / Tailwind (`transition-colors`, `transition-transform`) |
| Timelines, scroll-linked, coordinated JS | GSAP (`gsap-react`, `gsap-scrolltrigger`) |
| Avoid by default | Framer Motion / Motion |

### Frequency (emil-design-eng)
- No animation on keyboard-heavy actions (command palette, shortcuts)
- Minimal motion on elements used tens of times per day
- Modals, drawers, toasts: standard motion within duration scale above

## Components
- Buttons: Primary, Secondary, Ghost, Destructive
- Inputs: Base, Focus, Error
- Cards: Surface + subtle border + elevation
- Navigation: consistent layout, active state, breadcrumb support

## Accessibility Checklist
- All interactive elements have visible focus
- All icons have accessible labels
- All form inputs have labels and error messaging
- Skip link present on every page
- Reduced motion respected
