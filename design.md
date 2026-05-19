# SMARTUR Design System

**Source of truth:** PLATAFORMA (React + Vite, Tailwind v4)  
**Applies to:** LANDING (Astro 5, Tailwind v3) and PLATAFORMA

---

## 1. Color Tokens

All values are defined as RGB channels so they can be composed with `rgba()`.

### Brand Colors

| Token | Light Mode | Dark Mode | Hex (Light) |
|-------|-----------|-----------|-------------|
| `--rgb-pink-primary` | `252, 71, 142` | `255, 92, 157` | `#FC478E` |
| `--rgb-purple-accent` | `152, 78, 253` | `165, 105, 255` | `#984EFD` |
| `--rgb-cyan-accent` | `77, 185, 202` | `95, 200, 215` | `#4DB9CA` |
| `--rgb-green-accent` | `156, 204, 68` | `170, 215, 85` | `#9CCC44` |
| `--rgb-orange-cta` | `255, 125, 31` | `255, 140, 60` | `#FF7D1F` |

Semantic aliases:
- `--color-pink`: `rgb(var(--rgb-pink-primary))`
- `--color-purple`: `rgb(var(--rgb-purple-accent))`
- `--color-cyan`: `rgb(var(--rgb-cyan-accent))`
- `--color-green`: `rgb(var(--rgb-green-accent))`
- `--color-orange`: `rgb(var(--rgb-orange-cta))`

### Neutral / Surface Colors

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--rgb-bg` | `255, 255, 255` (pure white) | `15, 20, 25` (#0F1419) |
| `--rgb-bg-alt` | `245, 245, 250` (#F5F5FA) | `26, 29, 35` (#1A1D23) |
| `--rgb-text` | `30, 30, 35` (#1E1E23) | `232, 232, 240` (#E8E8F0) |
| `--rgb-text-alt` | `80, 80, 90` (#50505A) | `160, 160, 170` (#A0A0AA) |
| `--color-border` | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.1)` |

---

## 2. Typography

### Font Families

```css
--font-heading: "Cal Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-body:    "Outfit",   "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Type Scale

| Token | Value | Use |
|-------|-------|-----|
| `--font-size-base` | `20px` (desktop) / `18px` (tablet) / `16px` (mobile) | Body text |
| `--font-size-lg` | `1.1rem` | Lead/intro text |
| `--font-size-md` | `1rem` | Standard body |
| `--font-size-sm` | `0.9rem` | Secondary text, captions |
| `--font-size-xs` | `0.8rem` | Labels, badges, meta |

### Font Weights

| Use | Weight |
|-----|--------|
| Headings | 900 (black) |
| Section labels | 800 (extra-bold) |
| Body strong / nav | 700 (bold) |
| Body regular | 400 |

---

## 3. Easing Functions

```css
--ease-standard:        cubic-bezier(0.4, 0, 0.2, 1);
--ease-out-quad:        cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-out-cubic:       cubic-bezier(0.215, 0.61, 0.355, 1);    /* standard UI transitions */
--ease-out-quart:       cubic-bezier(0.165, 0.84, 0.44, 1);
--ease-out-quint:       cubic-bezier(0.23, 1, 0.32, 1);
--ease-out-expo:        cubic-bezier(0.19, 1, 0.22, 1);         /* dramatic reveals */
--ease-out-circ:        cubic-bezier(0.075, 0.82, 0.165, 1);
--ease-out-back:        cubic-bezier(0.34, 1.56, 0.64, 1);      /* elastic/bounce */
--ease-in-quad:         cubic-bezier(0.55, 0.085, 0.68, 0.53);
--ease-in-cubic:        cubic-bezier(0.55, 0.055, 0.675, 0.19);
--ease-in-quart:        cubic-bezier(0.895, 0.03, 0.685, 0.22);
--ease-in-expo:         cubic-bezier(0.95, 0.05, 0.795, 0.035);
--ease-in-out-cubic:    cubic-bezier(0.645, 0.045, 0.355, 1);
--ease-in-out-expo:     cubic-bezier(1, 0, 0, 1);
```

**Standard transition durations:**
- Quick (hover, toggle): `200ms`
- Standard (reveal, slide): `300ms`
- Smooth (menu, modal): `500ms–600ms`

---

## 4. Spacing

Based on a 4px grid (`0.25rem` unit):

| Name | Value | Use |
|------|-------|-----|
| `xs` | `0.25rem` (4px) | Micro gaps, icon padding |
| `sm` | `0.5rem` (8px) | Tight spacing |
| `md` | `1rem` (16px) | Default component gap |
| `lg` | `1.5rem` (24px) | Section sub-groups |
| `xl` | `2rem` (32px) | Component blocks |
| `2xl` | `3rem` (48px) | Section padding |
| `3xl` | `4rem` (64px) | Large section spacing |

**Container:**
- `max-width: 1240px` (72.5rem)
- Horizontal padding: `4rem` → `3rem` (tablet) → `2rem–2.5rem` (mobile)

---

## 5. Border Radius

| Name | Value | Use |
|------|-------|-----|
| `sm` | `8px` | Small cards, tags |
| `md` | `12px` | Buttons, inputs |
| `lg` | `16px` (1rem) | Cards, panels |
| `xl` | `20px` | Modal, large cards |
| `pill` | `50px–100px` | Navbar, pill buttons |
| `full` | `9999px` | Avatars, badges |

---

## 6. Button Variants

### `.btn-premium` (Primary CTA)
```css
background: var(--color-pink)     /* default */
           var(--color-purple)    /* alternate */
           var(--color-cyan)      /* tertiary */;
color: white;
border-radius: 100px;
padding: 0.8em 1.8em;
font-weight: 700;
/* Hover: clip-path reveal animation */
```

### Control Button (`.control-btn`)
```css
background: rgba(var(--rgb-text), 0.06);
border-radius: 12px;
color: var(--color-text);
padding: 0.5rem;
/* Hover: background → rgba(var(--rgb-text), 0.12) */
```

### Ghost / Link Button
```css
background: transparent;
color: var(--color-text-alt);
/* Hover: color → var(--color-pink) with underline reveal */
```

---

## 7. NavBar Specification

**Source of truth:** `PLATAFORMA/src/components/layout/FloatingNavbar.tsx`

| Property | Value |
|----------|-------|
| Max-width | `1240px` |
| Top offset | `0.75rem` (desktop), `0.5rem` (tablet) |
| Border-radius | `50px` |
| Background | `rgba(var(--rgb-bg), 0.88)` with `backdrop-filter: blur(20px)` |
| Border | `1px solid var(--color-border)` |
| Z-index | `100` |
| Logo height | `2.25rem` (desktop), `2rem` (mobile) |
| Nav link size | `15px`, `font-weight: 700` |
| Active link | `color: var(--color-pink)` + `2px` underline |
| Hide threshold | scroll > `400px` scrolling down |
| Small threshold | scroll > `80px` |

**Scroll behavior:**
- At top: transparent / no background
- After `80px`: glassmorphism background appears (`scaleY: 0 → 1`)
- Scrolling down past `400px`: slides out `translateY(-100%)`
- Scrolling up: slides back in

---

## 8. Footer Specification

**Source of truth:** `LANDING/src/components/Footer.astro`

| Property | Value |
|----------|-------|
| Background | `rgba(var(--rgb-bg), 0.92)` with `backdrop-filter: blur(20px)` |
| Border-top | `1px solid var(--color-border)` |
| Grid | `1.3fr 2.2fr` (desktop), `1fr` (tablet) |
| Columns | 4 columns (desktop), 2 (tablet), 1 (mobile) |
| Padding | `4rem 0 2rem` (desktop), `1.75rem 0 1.25rem` (mobile) |
| Logo height | `5.25rem` |
| Column title | `0.75rem`, `font-weight: 800`, uppercase, `letter-spacing: 0.05em` |

---

## 9. Dark / Light Mode

Both apps use `data-theme="dark"` on `<html>` element.

```css
/* Toggle implementation */
document.documentElement.dataset.theme = 'dark' | 'light';
/* Persisted in localStorage key: 'smartur-theme' */
```

**Theme transition:** `background-color 0.3s var(--ease-out-cubic), color 0.3s var(--ease-out-cubic)` on `html`.

---

## 10. i18n Specification

**Supported locales:** `es` (default), `en`, `fr`

| Context | Persistence | Implementation |
|---------|------------|----------------|
| LANDING | URL path prefix (`/en/`, `/fr/`) | Astro i18n `src/i18n/ui.ts` |
| PLATAFORMA | `localStorage['smartur-lang']` | React Context `LanguageContext.tsx` |

**Zero tolerance for Spanglish:** Every visible string must use the translation function for its locale. No hardcoded text in any language other than English in English-specific files.

---

## 11. WCAG Contrast Notes

| Pair | Light Ratio | Dark Ratio | AA Status |
|------|-------------|------------|-----------|
| Text on bg | ~18:1 | ~12:1 | ✅ AAA |
| Text-alt on bg | ~5.6:1 | ~7.2:1 | ✅ AA |
| Pink on bg | ~3.2:1 | ~6.6:1 | ⚠️ Light: AA Large only |
| Purple on bg | ~3.5:1 | ~7.1:1 | ⚠️ Light: AA Large only |
| Cyan on bg | ~2.4:1 | ~5.5:1 | ❌ Light: decorative only |

**Recommendation:** Brand colors (pink, purple, cyan) should be used for decorative/accent purposes and large headings. Never use them as the sole color indicator for required-reading body text. Navigation active states using pink are at font-weight: 700 which qualifies as large text (AA Large), acceptable.

---

## 12. Responsive Breakpoints

| Name | Value | LANDING | PLATAFORMA |
|------|-------|---------|------------|
| Mobile | `≤ 640px` | `--mq-phone` | `sm:` |
| Tablet | `≤ 1024px` | `--mq-tablet` | `md:` |
| Desktop | `> 1024px` | default | `lg:` |
| Large | `≥ 1280px` | `--mq-desktop-sm` | `xl:` |
