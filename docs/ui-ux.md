# UI/UX Design Specification
# TeamSync 📅 — University Team Scheduling Tool

**Version:** 1.0.0  
**Date:** 2026-09-11

---

## 1. Design Principles

| Principle       | Description                                                       |
|-----------------|-------------------------------------------------------------------|
| Premium First   | Every screen should feel polished and intentional                 |
| Clarity         | Availability status must be immediately legible at a glance       |
| Speed           | UI updates happen instantly; no waiting for page reloads          |
| Mobile-first    | Designed for 375px width, enhanced for desktop                    |
| Minimal Friction| One click to set availability — no forms or submit buttons        |

---

## 2. Color System

### Brand Colors
| Token           | Hex       | Usage                                 |
|-----------------|-----------|---------------------------------------|
| Navy Primary    | #1F4E79   | Login background, day cell headers    |
| Navy Dark       | #0F2D47   | Gradient end, hover states            |
| Navy Light      | #2E6DA4   | Accent borders, active states         |
| White           | #FFFFFF   | Primary text on dark backgrounds      |
| Off White       | #F8FAFC   | Page background                       |

### Status Colors
| Status          | Background | Border    | Text      | Emoji |
|-----------------|------------|-----------|-----------|-------|
| Available       | #C6EFCE    | #70AD47   | #375623   | ✅    |
| Not Available   | #FFC7CE    | #FF0000   | #9C0006   | ❌    |
| Maybe           | #FFEB9C    | #FFAB00   | #7D4E00   | ⚠️    |
| Not Set         | #F5F5F5    | #D1D5DB   | #6B7280   | —     |

### UI Colors
| Token           | Hex       | Usage                                 |
|-----------------|-----------|---------------------------------------|
| Gold Accent     | #F59E0B   | Best slot highlight, trophy icon      |
| Success Green   | #10B981   | Live indicator, save toast            |
| Error Red       | #EF4444   | Error states, denied page             |
| Gray 100        | #F3F4F6   | Card backgrounds                      |
| Gray 200        | #E5E7EB   | Table borders                         |
| Gray 700        | #374151   | Body text                             |
| Gray 900        | #111827   | Heading text                          |

---

## 3. Typography

| Element           | Font Family       | Size    | Weight  | Color      |
|-------------------|-------------------|---------|---------|------------|
| App Logo          | Inter             | 2xl     | 800     | White      |
| Page Heading      | Inter             | xl      | 700     | Gray 900   |
| Table Headers     | Inter             | sm      | 600     | Gray 700   |
| Body Text         | Inter             | sm      | 400     | Gray 700   |
| Status Badges     | Inter             | xs      | 600     | Status-specific|
| Score Numbers     | Inter Mono        | sm      | 700     | Gray 900   |
| Toast Messages    | Inter             | sm      | 500     | White      |

Google Font import: `Inter` (weights: 400, 500, 600, 700, 800)

---

## 4. Component Specifications

### 4.1 Login Page

```
┌────────────────────────────────────────────────────────┐
│                   (Navy gradient bg)                   │
│                                                        │
│          ┌──────────────────────────────────┐          │
│          │           TeamSync 📅             │          │
│          │  Your university team scheduling │          │
│          │           tool                   │          │
│          │                                  │          │
│          │  ┌────────────────────────────┐  │          │
│          │  │  🔵 Sign in with Google    │  │          │
│          │  └────────────────────────────┘  │          │
│          │                                  │          │
│          │  [spinner shown during OAuth]    │          │
│          └──────────────────────────────────┘          │
│                                                        │
└────────────────────────────────────────────────────────┘

Card: white bg, rounded-2xl, shadow-2xl, p-10
Button: white bg, border-gray-300, hover:shadow-lg, rounded-lg
Google icon: 20px, left-aligned in button
```

### 4.2 Navigation Bar

```
┌──────────────────────────────────────────────────────────────┐
│  TeamSync 📅      [My Availability] [Team Availability]     │
│                                       [Avatar] Name [Logout] │
└──────────────────────────────────────────────────────────────┘

Height: 64px
Background: white + bottom shadow
Tab active: blue text + blue bottom border (2px)
Tab inactive: gray text + hover:gray-100 bg
Avatar: 36px circle, object-cover
Logout button: text-red-600, hover:bg-red-50, rounded
```

### 4.3 My Availability Table

```
Progress counter: "12 / 25 slots filled" pill above table

┌─────────────┬────────────────────┬───────────────────────┬────────────────┐
│ Day         │ Time Slot          │ Availability           │ Remarks        │
├─────────────┼────────────────────┼───────────────────────┼────────────────┤
│             │ 8:30–9:10 AM       │ [✅][❌][⚠️]           │ [text input]   │
│  Saturday   │ 9:11–11:10 AM      │ [✅][❌][⚠️]           │ [text input]   │
│  (rowspan)  │ 11:11 AM–12:30 PM  │ [✅][❌][⚠️]           │ [text input]   │
│             │ 12:31–1:50 PM      │ [✅][❌][⚠️]           │ [text input]   │
│             │ 1:51–3:10 PM       │ [✅][❌][⚠️]           │ [text input]   │
├─────────────┼────────────────────┼───────────────────────┼────────────────┤
│  Sunday     │ ...                │ ...                   │ ...            │

Day Cell:
  - bg-navy (#1F4E79), text-white, font-bold
  - vertical-align: middle, text-center
  - rowspan=5

Status Button Group:
  - 3 inline buttons, border separated
  - Selected: solid color bg (green/red/amber) + bold
  - Unselected: light bg + dimmed opacity
  - Hover: darken selected color

Row Background: status color (C6EFCE / FFC7CE / FFEB9C / F5F5F5)

Remarks Input:
  - borderless inside cell
  - bg: transparent (inherits row color)
  - max-length: 100
  - placeholder: "Add a note..."
```

### 4.4 Member Status Bar

```
┌─────────────────────────────────────────────────────────┐
│                   Team Members                          │
│                                                         │
│  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐            │
│  │  M   │   │  O   │   │  R   │   │  Mj  │            │
│  │ (🟢) │   │ (🟢) │   │ (⚫) │   │ (🟢) │            │
│  └──────┘   └──────┘   └──────┘   └──────┘            │
│  Mehedi     Omor        Rayan      Mahjabin             │
│  18/25      12/25       0/25       20/25                │
│                                                         │
└─────────────────────────────────────────────────────────┘

Avatar:
  - 56px circle
  - Google photo if available, else initial letter
  - Initial: white text, navy bg, font-bold, text-xl
  - Green/grey dot: 12px circle, bottom-right corner, white ring

Tooltip on hover: "Mehedi: 18 / 25 slots filled"
```

### 4.5 Best Slot Banner

```
┌─────────────────────────────────────────────────────────────┐
│  🏆  BEST COMMON MEETING SLOT                               │
│                                                             │
│  Wednesday · 11:11 AM – 12:30 PM                           │
│                                                             │
│  ✅ 3 Available   ⚠️ 1 Maybe   ❌ 0 Not Available           │
│  Overall Score: 7 / 8                                       │
└─────────────────────────────────────────────────────────────┘

Card:
  - bg: linear-gradient(135deg, #FFF9E6, #FFFBF0)
  - border: 2px solid #F59E0B
  - border-radius: 12px
  - shadow-lg
  - padding: 24px

Title: text-amber-600, font-bold, text-sm, uppercase, letter-spacing
Day/Slot: text-gray-900, font-bold, text-xl
Breakdown pills: small colored pills (green/yellow/red)
Score: text-amber-700, font-semibold

Empty state: gray card with "No availability data yet..." message
```

### 4.6 Team Comparison Table

```
"🔴 Live" badge: top-right of section, pulsing red dot + "Live" text

┌──────────┬──────────────────┬────────┬──────┬───────┬──────────┬───────┐
│ Day      │ Time Slot        │ Mehedi │ Omor │ Rayan │ Mahjabin │ Score │
├──────────┼──────────────────┼────────┼──────┼───────┼──────────┼───────┤
│          │ 8:30–9:10 AM     │  ✅    │  ✅  │  ⚠️   │  ❌      │  5    │
│ Saturday │ 9:11–11:10 AM    │  ❌    │  ✅  │  ❌   │  ✅      │  4    │
│          │ 11:11AM–12:30 PM │  ✅    │  ✅  │  ✅   │  ⚠️      │  7 🏆 │
│          │ 12:31–1:50 PM    │  ⚠️    │  ❌  │  ⚠️   │  ✅      │  4    │
│          │ 1:51–3:10 PM     │  ✅    │  ✅  │  ✅   │  ✅      │  8 🏆 │

Best row highlight:
  - left border: 4px solid #F59E0B
  - bg: #FEFCE8 (light gold)
  - Score cell: badge with "🏆 Best" + score

Member status cells:
  - Emoji centered in cell
  - Cell bg: status color
  - Width: 80px min

Day cell: same navy style as My Availability table
```

---

## 5. Responsive Breakpoints

| Breakpoint | Width   | Adaptations                                  |
|------------|---------|----------------------------------------------|
| Mobile     | < 640px | Horizontal scroll on tables, stacked nav, smaller avatars |
| Tablet     | 640-1024px| Nav stays in one line, tables fit with scroll |
| Desktop    | > 1024px | Full layout as designed                     |

### Mobile Specific
- Tables: `overflow-x-auto` wrapper, `min-width: 600px` on table
- Nav: Logo + hamburger or condensed layout
- Member bar: Wrap to 2x2 grid on very small screens
- Status buttons: Slightly smaller padding

---

## 6. Animations & Interactions

| Interaction          | Animation                                              |
|----------------------|--------------------------------------------------------|
| Status button click  | Scale 0.95 → 1 + color transition (150ms)             |
| Row bg change        | background-color transition 300ms ease                |
| Toast appear         | Slide in from top-right, fade out after 2s            |
| Realtime update      | Affected row briefly pulses (yellow flash, 500ms)     |
| Avatar tooltip       | Fade in (150ms), no delay                             |
| Live indicator       | Slow pulse animation (2s cycle) on red dot            |
| Page transition      | Fade in (200ms) on route change                       |
| Loading skeleton     | Shimmer animation on skeleton loaders                 |

---

## 7. Error States

| Scenario                 | UI Treatment                                           |
|--------------------------|--------------------------------------------------------|
| Save failed              | Toast: "Save failed — try again" (red)                |
| Session expired          | Redirect to / with "Session expired" message          |
| No team data             | Empty state illustration + helper text                |
| Unauthorized email       | Full-page /denied with clear message + logout button  |
| Network error            | Inline error with retry button                        |

---

## 8. Accessibility

- All interactive elements have `aria-label` attributes
- Status buttons have `role="radiogroup"` + `aria-pressed` 
- Color is never the only indicator (emoji + color used together)
- Focus ring visible on all interactive elements
- Contrast ratios meet WCAG AA (4.5:1 for normal text)
- `alt` text on all avatar images

---

## 9. Page Layout Grid

```
Root Layout:
  ┌────────────────────────────────────────────┐
  │                NAVBAR (64px)               │
  ├────────────────────────────────────────────┤
  │                                            │
  │           PAGE CONTENT                     │
  │     max-width: 1200px, mx-auto             │
  │     px: 16px (mobile) / 32px (desktop)     │
  │     py: 32px                               │
  │                                            │
  └────────────────────────────────────────────┘
```

---

## 10. shadcn/ui Components Used

| Component   | Used For                              |
|-------------|---------------------------------------|
| Button      | Status selector, Sign in, Logout      |
| Card        | Login card, Best slot banner          |
| Badge       | Score badges, Live indicator          |
| Tooltip     | Member avatar hover info              |
| Input       | Remarks text field                    |
| Avatar      | User avatar in nav + member bar       |
| Separator   | Section dividers                      |
| Toast/Sonner| Save confirmation toasts             |
| Skeleton    | Loading states                        |
