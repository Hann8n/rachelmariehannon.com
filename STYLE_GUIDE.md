# Rachel Marie Hannon — Style Guide

This guide defines typography, spacing, and component styles so the site stays consistent. It follows common web typography practice: a **modular type scale**, clear **hierarchy**, and **semantic text roles**.

---

## 1. Type scale

We use a **Minor Third (1.2)** scale with base **1rem (16px)**. Each step is 1.2× the previous.

| Token | Size (rem) | ~px | Use |
|-------|------------|-----|-----|
| `--text-caption` | 0.694 | ~11 | Tags, meta, labels |
| `--text-small` | 0.833 | ~13 | Secondary text, footer, overline, nav |
| `--text-body` | 1 | 16 | Default body copy |
| `--text-lead` | 1.2 | ~19 | Lead paragraph, tagline, card titles |
| `--text-h3` | 1.44 | ~23 | Subsection heading (e.g. column title) |
| `--text-h2` | 1.728 | ~28 | Section heading |
| `--text-h1` | 2.074 | ~33 | Page/section hero |
| `--text-display` | 2.488 | ~40 | Site title (with clamp for responsive) |

**Reference:** [Type Scale](https://type-scale.com/), [Modular Scale](https://www.modularscale.com/), [Web Typography (design.dev)](https://design.dev/guides/typography-web-design/).

---

## 2. Line heights

| Token | Value | Use |
|-------|--------|-----|
| `--leading-tight` | 1.2 | Large headings, site title |
| `--leading-snug` | 1.35 | Section headings, card titles |
| `--leading-normal` | 1.6 | Body text, lists |
| `--leading-relaxed` | 1.75 | Lead paragraphs, blockquotes |

---

## 3. Text roles (when to use what)

| Role | CSS class / element | Size | Weight | Notes |
|------|----------------------|------|--------|--------|
| **Display** | `.site-title-block h1` | `--text-h1` → `--text-display` (clamp) | 400 | One per page, letter-spacing -0.02em |
| **Overline** | `.subtitle` | `--text-small` | 500 | Uppercase, letter-spacing 0.2em, soft color |
| **Byline** | `.byline` | `--text-small` | 400 italic | Author name in byline: 600, normal, accent color |
| **H2 – Section title** | `.section h2` | `--text-h2` | 700 | Section heading inside cards |
| **H3 – Subsection** | `.section h3`, `.about-block h3` | `--text-h3` or `--text-small` | 700 | Column titles use small + uppercase + letter-spacing |
| **Body** | `.section p`, default paragraphs | `--text-body` | 400 | Main content |
| **Lead** | `.lede` | `--text-lead` | 400 | First/intro paragraph of a section |
| **Tagline** | `.section-tagline` | `--text-body` | 400 | Supporting line under a section heading; use `--color-text-soft` |
| **Quote** | `blockquote` | `--text-lead` | 400 italic | Left border, soft background |
| **Quote attribution** | `.quote-attribution` | `--text-small` | 400 | Normal style, soft color |
| **Small / secondary** | Footer, meta, nav | `--text-small` | 400 | Secondary info |
| **Caption / label** | `.substack-feed-card-tag`, meta | `--text-caption` | 500 | Tags, labels, small UI |
| **Button / link text** | `.button`, `.substack-header-link-text` | `--text-body` or `--text-small` | 500–600 | Actions and nav |
| **Card title** | `.substack-feed-card-title` | `--text-lead` | 600 | Feed item titles |
| **Card description** | `.substack-feed-card-description` | `--text-body` | 400 | Soft color |
| **Card meta** | `.substack-feed-card-meta` | `--text-small` | 400 | Date, read time |
| **Error / loading** | `.section-error`, `.section-loading` | `--text-small` / `--text-body` | 400–500 | Inline messages |

---

## 4. Spacing scale

Use these tokens for margins and padding so spacing is consistent.

| Token | Value |
|-------|--------|
| `--space-xs` | 0.25rem (4px) |
| `--space-sm` | 0.5rem (8px) |
| `--space-md` | 0.75rem (12px) |
| `--space-lg` | 1rem (16px) |
| `--space-xl` | 1.5rem (24px) |
| `--space-2xl` | 2rem (32px) |
| `--space-3xl` | 2.5rem (40px) |

**Guidelines:**
- Paragraph margin-bottom: `--space-md`
- Space below headings: `--space-sm`
- Section padding: `--space-3xl` (smaller on narrow screens)
- Gaps between sections: `--space-xl`

---

## 5. Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--color-text` | #1a1a1a | Primary text |
| `--color-text-soft` | #444 | Secondary text, taglines, meta, footer |
| `--color-brown-dark` | #7B3C25 | Links, author name, emphasis |
| `--color-terracotta` | #DA8861 | Link hover, error text |
| `--color-peach-warm` | #DB9E83 | Quote border, footer link hover |
| `--color-peach-light` | #E5C1AE | Section accent (left border) |
| `--color-teal` | #5DB1A3 | Primary button, focus ring |
| `--color-bg` | #f8f6f3 | Page background |
| `--color-bg-card` | #fffefc | Section/card background |
| `--color-border` | rgba(26,26,26,0.12) | Borders, dividers |

---

## 6. Sections

All sections share one **unified style**:

- **Container:** `--color-bg-card`, 1px `--color-border`, `--radius` (8px), `--shadow` / `--shadow-hover` on hover
- **Accent:** 4px left border using `--section-accent` (all section types use `--color-peach-light`)
- **Padding:** `--space-3xl` (reduced in responsive)
- **Spacing between sections:** `--space-xl`

Section types (text, quote, list, two-column, substack, etc.) do **not** change card style or accent; they only change content layout (e.g. grid, blockquote, feed).

---

## 7. Links and buttons

- **In-content links:** `--color-brown-dark`, underline on hover (`--color-terracotta`), focus ring `2px solid var(--color-teal)`
- **Footer links:** `--color-text-soft`, hover `--color-peach-warm`
- **Primary button (e.g. “Load more”):** Teal underline style, hover to brown-dark, focus ring teal
- **Substack CTA:** Orange tint background, hover darken; focus ring orange

---

## 8. Fonts

- **Headings:** `--font-heading` → Libre Baskerville, fallback serif
- **Body:** `--font-body` → Lora, fallback Georgia / Times New Roman

Limit to these two families. Use weight (400, 500, 600, 700) and the type scale for hierarchy.

---

## 9. Accessibility

- Body text at least 16px (`--text-body` = 1rem)
- Line height for body at least 1.5 (`--leading-normal` = 1.6)
- Don’t rely on color alone: links have underline on hover; focus uses visible outline
- Sufficient contrast: `--color-text` on `--color-bg` and `--color-bg-card` meets AA

---

## 10. CSS variables quick reference

All of the above are defined in `styles.css` under `:root`. Use the tokens (e.g. `var(--text-body)`, `var(--space-lg)`) instead of raw values so the whole site stays consistent and easy to tweak in one place.
