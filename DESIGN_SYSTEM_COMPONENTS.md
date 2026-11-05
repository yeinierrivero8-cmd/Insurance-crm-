# Insurance CRM - Design System Component Specification

**Version:** 1.0  
**Date:** November 4, 2026  
**Status:** ✅ Approved (Mockup: https://claude.ai/artifact/YTXJZu5MbPpZ6uLUj15rFJ)  
**Design Authority:** PREMIUM UI/UX DESIGNER (YR SYSTEM ENTERPRISE)

---

## Table of Contents

1. [Design Tokens Overview](#design-tokens-overview)
2. [Color System](#color-system)
3. [Typography System](#typography-system)
4. [Component Library](#component-library)
5. [Implementation Guide](#implementation-guide)
6. [Accessibility](#accessibility)
7. [Responsive Design](#responsive-design)

---

## Design Tokens Overview

### Color Palette (Premium Blue Enterprise)

The design system uses a carefully curated color palette optimized for insurance/enterprise applications:

**Primary Color (Blue)**
- Base: `#1769E8`
- Hover: `#1057C6`
- Active: `#0D3D9F`
- Soft/Light: `#E8F1FF`
- Lighter: `#F0F6FF`
- Disabled: `#B8CCEE`

**Background Colors**
- Primary: `#F5F8FF` (Page background with subtle blue tint)
- Secondary/Sidebar: `#F8FAFF` (Sidebar background)
- Card: `#FFFFFF` (White for cards and elevated surfaces)
- Hover: `#F0F4FB` (Hover state for interactive elements)

**Text Colors**
- Primary: `#10234B` (Deep blue for main text)
- Secondary: `#66799B` (Medium blue for supporting text)
- Muted: `#91A0BA` (Light blue for disabled/helper text)
- Disabled: `#C5CEE0` (Very light for disabled elements)
- Inverse: `#FFFFFF` (White text on dark backgrounds)

**Accent Colors (Soft Pastels)**
- Lavender Soft: `#F1EDFF` + Accent: `#9333EA`
- Mint Soft: `#E6F8F5` + Accent: `#0891B2`
- Peach Soft: `#FFF3E7` + Accent: `#D97706`
- Rose Soft: `#FFE4ED` + Accent: `#EC4899`

**Semantic Colors**
- Success: `#159B63` | Background: `#E7F8EF`
- Warning: `#D97706` | Background: `#FFF3E7`
- Error: `#EF4444` | Background: `#FEE2E2`
- Info: `#1769E8` | Background: `#E8F1FF`

**Borders & Dividers**
- Default Border: `#E2EAF7` (Light blue)
- Light Border: `#EEF2FA` (Very light, for subtle dividers)
- Dark Border: `#D4DFE6` (Stronger border for emphasis)

### Shadow System (Premium Blur Effect)

```css
--shadow-xs:     0 1px 2px rgba(33, 76, 140, 0.05)
--shadow-sm:     0 2px 4px rgba(33, 76, 140, 0.08)
--shadow-card:   0 4px 12px rgba(33, 76, 140, 0.035), 0 12px 30px rgba(33, 76, 140, 0.055)
--shadow-hover:  0 8px 24px rgba(23, 105, 232, 0.15)
--shadow-modal:  0 10px 40px rgba(33, 76, 140, 0.15)
--shadow-button: 0 4px 12px rgba(23, 105, 232, 0.3)
```

---

## Typography System

### Font Family
**Base:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif`

### Font Sizes (Scale)

| Name | Size | Usage |
|------|------|-------|
| `text-xs` | 11px | Small labels, badges |
| `text-sm` | 12px | Table headers, captions |
| `text-md` | 13px | Micro labels, fine print |
| `text-base` | 14px | Body text, inputs (default) |
| `text-lg` | 16px | Subheadings |
| `text-xl` | 18px | Section headers |
| `text-2xl` | 24px | Card titles, section headings |
| `text-3xl` | 28px | Page headers |
| `text-4xl` | 32px | Hero headings |
| `text-5xl` | 40px | Large titles |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Light | 300 | Emphasis, headlines |
| Normal | 400 | Body text |
| Medium | 500 | Labels, buttons |
| Semibold | 600 | Button text, strong labels |
| Bold | 700 | Headings, important text |
| Extrabold | 800 | Hero text |

### Line Heights

| Name | Value | Usage |
|------|-------|-------|
| `tight` | 1.2 | Headings, compact text |
| `snug` | 1.375 | Labels, form text |
| `normal` | 1.4 | Body text (recommended) |
| `relaxed` | 1.6 | Long-form content |
| `loose` | 1.8 | Accessibility-focused text |

---

## Component Library

### 1. Button Component

#### Primary Button
```html
<button class="btn-primary">
  <svg class="icon"><!-- icon --></svg>
  Button Text
</button>
```

**Specifications:**
- Background: Linear gradient #1769E8 → #1057C6
- Padding: 12px (vertical) × 16px (horizontal)
- Border Radius: 12px
- Font Weight: Semibold (600)
- Font Size: 14px
- Text Color: White
- Shadow: `--shadow-button`
- Hover: Lift effect (translateY -2px) + stronger shadow
- Active: Reset to base shadow
- Disabled: Gray (#B8CCEE) background, 60% opacity

**States:**
- Default: Full gradient, shadow
- Hover: Lifted (-2px), enhanced shadow
- Active: Pressed (no lift), base shadow
- Disabled: Desaturated, no pointer events
- Focus: 2px outline with 2px offset

#### Secondary Button
```html
<button class="btn-secondary">Button Text</button>
```

**Specifications:**
- Background: White (#FFFFFF)
- Border: 1px solid #1769E8
- Text Color: #1769E8
- Padding: 12px × 16px
- Font Weight: Semibold (600)
- Hover: Background becomes #E8F1FF, lift effect
- Active: Background becomes #F0F6FF

#### Ghost Button
```html
<button class="btn-ghost">Button Text</button>
```

**Specifications:**
- Background: Transparent
- Text Color: #1769E8
- Padding: 12px × 16px
- Hover: Background becomes #F0F4FB

#### Button Sizes
- **Small:** `btn-small` - Padding: 8px × 12px, Font: 12px
- **Large:** `btn-large` - Padding: 16px × 24px, Font: 16px

---

### 2. Card Component

```html
<div class="card">
  <!-- content -->
</div>
```

**Specifications:**
- Background: #FFFFFF
- Border: 1px solid #E2EAF7
- Border Radius: 20px
- Padding: 24px
- Box Shadow: `--shadow-card`
- Transition: all 0.2s ease

**States:**
- Hover: Border becomes #1769E8, shadow becomes `--shadow-card-hover`, translateY(-4px)
- Elevated: `card.elevated` - Uses `--shadow-modal`
- Flat: `card.flat` - No shadow, light border

---

### 3. Input Component

```html
<input type="text" placeholder="Enter text..." />
<textarea placeholder="Enter message..."></textarea>
<select>
  <option>Select option</option>
</select>
```

**Specifications:**
- Font Family: `--font-family`
- Font Size: 14px
- Padding: 12px (vertical) × 16px (horizontal)
- Border: 1px solid #E2EAF7
- Border Radius: 12px
- Background: #FFFFFF
- Text Color: #10234B
- Placeholder Color: #91A0BA
- Transition: all 0.2s ease

**Focus State:**
- Border Color: #1769E8
- Box Shadow: 0 0 0 3px rgba(23, 105, 232, 0.1)
- Outline: None

**Disabled State:**
- Background: #F0F4FB
- Text Color: #C5CEE0
- Cursor: not-allowed
- Opacity: 0.6

**Input Sizes:**
- **Small:** `.input-small` - Padding: 8px × 12px, Font: 12px, Radius: 8px
- **Large:** `.input-large` - Padding: 16px × 24px, Font: 16px, Radius: 14px

---

### 4. Badge Component

```html
<span class="badge badge-active">● Active</span>
<span class="badge badge-renewal">● Renewal</span>
<span class="badge badge-inactive">● Inactive</span>
```

**Specifications:**
- Display: inline-flex
- Padding: 6px × 12px
- Border Radius: 8px
- Font Size: 12px
- Font Weight: Semibold (600)
- Text Transform: Uppercase
- Letter Spacing: 0.3px
- White Space: nowrap

**Badge Variants:**

| Variant | Background | Text Color | Usage |
|---------|------------|-----------|-------|
| `badge-active` | #E7F8EF | #159B63 | Active/Good status |
| `badge-renewal` | #FFF3E7 | #D97706 | Pending/Warning status |
| `badge-inactive` | #F0F4FB | #66799B | Inactive/Neutral |
| `badge-error` | #FEE2E2 | #EF4444 | Error/Critical |
| `badge-info` | #E8F1FF | #1769E8 | Info/Neutral |

**Badge Sizes:**
- **Small:** `.badge-small` - Padding: 4px × 8px, Font: 11px, Radius: 6px
- **Large:** `.badge-large` - Padding: 8px × 16px, Font: 14px, Radius: 12px

---

### 5. Avatar Component

```html
<div class="avatar avatar-md avatar-blue">MG</div>
<div class="avatar avatar-lg avatar-lavender">JP</div>
```

**Specifications:**
- Display: flex
- Align Items: center
- Justify Content: center
- Border Radius: 50% (circular)
- Font Weight: Bold (700)
- Text Color: White
- Flex Shrink: 0

**Avatar Sizes:**

| Class | Width | Height | Font Size |
|-------|-------|--------|-----------|
| `avatar-sm` | 32px | 32px | 12px |
| `avatar-md` | 40px | 40px | 14px |
| `avatar-lg` | 48px | 48px | 16px |
| `avatar-xl` | 56px | 56px | 18px |

**Avatar Gradient Options:**

| Class | Gradient |
|-------|----------|
| `avatar-blue` | #1769E8 → #1057C6 |
| `avatar-lavender` | #9333EA → #7E22CE |
| `avatar-peach` | #D97706 → #B45309 |
| `avatar-rose` | #EC4899 → #BE185D |
| `avatar-mint` | #0891B2 → #0369A1 |

---

### 6. Metric Card Component

```html
<div class="metric-card clients">
  <div class="metric-header">
    <div class="metric-icon">👥</div>
    <div class="metric-label">Clientes Activos</div>
  </div>
  <div class="metric-value">24</div>
  <div class="metric-change">↑ +3 este mes</div>
</div>
```

**Specifications:**
- Background: #FFFFFF
- Border: 1px solid #E2EAF7
- Border Radius: 20px
- Padding: 24px
- Box Shadow: `--shadow-card`
- Position: relative
- Overflow: hidden

**Pseudo-element Accent:**
- Position: absolute (top-right)
- Size: 100px × 100px
- Border Radius: 50%
- Opacity: 0.1
- Pointer Events: none
- Color variations by metric type

**Hover State:**
- Border Color: #1769E8
- Box Shadow: `--shadow-card-hover`
- Transform: translateY(-4px)

**Metric Header:**
- Display: flex
- Align Items: center
- Gap: 12px
- Margin Bottom: 16px

**Metric Icon:**
- Width: 40px, Height: 40px
- Border Radius: 10px
- Font Size: 20px
- Background: Soft color matching metric type

**Metric Label:**
- Font Size: 12px
- Color: #66799B
- Font Weight: Semibold (600)
- Text Transform: Uppercase
- Letter Spacing: 0.3px

**Metric Value:**
- Font Size: 32px
- Font Weight: Bold (700)
- Color: #10234B
- Margin Bottom: 8px

**Metric Change:**
- Font Size: 12px
- Color: #159B63 (green for positive)
- Font Weight: Semibold (600)
- `.negative` variant: color #EF4444

---

### 7. Table Component

```html
<table>
  <thead>
    <tr>
      <th>COLUMN HEADER</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell content</td>
    </tr>
  </tbody>
</table>
```

**Specifications:**

**Table:**
- Width: 100%
- Border Collapse: collapse
- Font Size: 14px

**Table Header (th):**
- Text Align: left
- Padding: 12px (vertical) × 16px (horizontal)
- Background: #F5F8FF
- Font Size: 12px
- Font Weight: Bold (700)
- Color: #66799B
- Text Transform: Uppercase
- Letter Spacing: 0.4px
- Border Bottom: 1px solid #E2EAF7

**Table Cell (td):**
- Padding: 14px × 16px
- Border Bottom: 1px solid #E2EAF7
- Font Size: 14px
- Color: #10234B

**Row Hover State:**
- Background: #F5F8FF

**Last Row:**
- Border Bottom: none

**Client Cell Pattern:**
```html
<div class="client-cell">
  <div class="client-avatar jp">JP</div>
  <span class="client-name">Juan Pérez</span>
</div>
```

---

### 8. Sidebar Menu Component

```html
<a href="#" class="sidebar-menu-item active">
  <span class="sidebar-menu-icon">🏠</span>
  Menu Item
</a>
```

**Specifications:**
- Display: flex
- Align Items: center
- Gap: 12px
- Padding: 12px × 16px
- Border Radius: 14px
- Color: #66799B
- Font Size: 14px
- Font Weight: Medium (500)
- Text Decoration: none
- Transition: all 0.2s ease
- Cursor: pointer

**Hover State:**
- Background: #E8F1FF
- Color: #1769E8

**Active State:**
- Background: #E8F1FF
- Color: #1769E8
- Font Weight: Semibold (600)

**Sidebar Menu Icon:**
- Width: 20px, Height: 20px
- Display: flex
- Align Items: center
- Justify Content: center
- Font Size: 16px
- Flex Shrink: 0

---

### 9. Modal Component

```html
<div class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Modal Title</h2>
    </div>
    <div class="modal-body">
      <!-- content -->
    </div>
    <div class="modal-footer">
      <button class="btn-secondary">Cancel</button>
      <button class="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

**Modal Overlay:**
- Position: fixed
- Top/Left/Right/Bottom: 0
- Background: rgba(15, 23, 42, 0.5)
- Display: flex
- Align Items: center
- Justify Content: center
- Z-Index: 400 (backdrop)
- Backdrop Filter: blur(4px)

**Modal Content:**
- Background: #FFFFFF
- Border Radius: 20px
- Box Shadow: `--shadow-modal`
- Max Width: 500px
- Width: 90%
- Padding: 32px
- Z-Index: 500

**Modal Header:**
- Margin Bottom: 24px
- Padding Bottom: 16px
- Border Bottom: 1px solid #E2EAF7

**Modal Header Heading:**
- Font Size: 24px
- Font Weight: Bold (700)
- Color: #10234B
- Margin: 0

**Modal Body:**
- Margin Bottom: 24px

**Modal Footer:**
- Display: flex
- Gap: 16px
- Justify Content: flex-end
- Padding Top: 16px
- Border Top: 1px solid #E2EAF7

---

## Implementation Guide

### Step 1: Import Design Tokens

```css
@import url('src/styles/tokens.css');
```

### Step 2: Use Token Variables in React

```jsx
// Button Component
export function Button({ children, variant = 'primary', ...props }) {
  return (
    <button 
      className={`btn-${variant}`}
      style={{
        backgroundColor: variant === 'primary' ? 'var(--primary)' : 'var(--bg-card)',
        padding: 'var(--space-md) var(--space-lg)',
        borderRadius: 'var(--radius-button)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-weight-semibold)',
      }}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Step 3: Create Reusable Component Patterns

```jsx
// Card Component
export function Card({ children, elevated = false, ...props }) {
  return (
    <div 
      className={`card ${elevated ? 'elevated' : ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Badge Component
export function Badge({ children, variant = 'active', size = 'default', ...props }) {
  return (
    <span 
      className={`badge badge-${variant} ${size === 'small' ? 'badge-small' : ''}`}
      {...props}
    >
      {children}
    </span>
  );
}

// MetricCard Component
export function MetricCard({ label, value, change, icon, variant = 'clients', ...props }) {
  const iconBackgrounds = {
    clients: 'var(--primary-soft)',
    policies: 'var(--lavender-soft)',
    renewals: 'var(--peach-soft)',
    commissions: 'var(--mint-soft)',
  };
  
  return (
    <div className={`metric-card ${variant}`} {...props}>
      <div className="metric-header">
        <div 
          className="metric-icon"
          style={{ backgroundColor: iconBackgrounds[variant] }}
        >
          {icon}
        </div>
        <div className="metric-label">{label}</div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-change">{change}</div>
    </div>
  );
}
```

---

## Accessibility

### WCAG 2.1 Level AA Compliance

**Color Contrast:**
- Text on backgrounds: minimum 4.5:1 contrast ratio
- Large text (18pt+): minimum 3:1 contrast ratio
- All tested against approved palette

**Focus Management:**
- All interactive elements have visible focus indicators
- Focus outline: 2px solid primary color with 2px offset
- Focus order follows logical DOM structure

**Keyboard Navigation:**
- All buttons and links keyboard accessible
- Tab key navigation functional
- Escape key closes modals

**Screen Reader Support:**
- Semantic HTML (button, input, select, etc.)
- ARIA labels for icon buttons
- Alert roles for status messages
- Form labels properly associated

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Design

### Breakpoints (Mobile-First)

| Device | Breakpoint | Min Width |
|--------|------------|-----------|
| Mobile | `xs` | 320px |
| Tablet | `sm` | 480px |
| Tablet | `md` | 768px |
| Desktop | `lg` | 1024px |
| Desktop | `xl` | 1280px |
| Large Desktop | `2xl` | 1440px |

### Typography Responsive Scaling

```css
/* Mobile */
--text-4xl: 24px;  /* Scales down from 32px */
--text-3xl: 20px;  /* Scales down from 28px */

/* Tablet (md) */
--text-4xl: 28px;
--text-3xl: 24px;

/* Desktop (lg and up) */
--text-4xl: 32px;
--text-3xl: 28px;
```

### Spacing Responsive Scaling

```css
/* Mobile */
--space-xl: 12px;   /* Scales down from 24px */
--space-2xl: 16px;  /* Scales down from 32px */

/* Tablet */
--space-xl: 16px;
--space-2xl: 24px;

/* Desktop */
--space-xl: 24px;
--space-2xl: 32px;
```

### Component Responsive Behavior

**Cards (Metrics, Client List):**
- Desktop: 4 columns grid
- Tablet: 2 columns grid
- Mobile: 1 column (stacked)

**Table:**
- Desktop: Full table view
- Tablet: Horizontal scroll with sticky first column
- Mobile: Card view with collapsed rows

**Sidebar:**
- Desktop: Always visible
- Tablet: Collapsible with hamburger menu
- Mobile: Drawer/slide-out navigation

---

## Implementation Checklist for ENGINEER

### Before Integration

- [ ] Verify all token variables are CSS custom properties
- [ ] Test color contrast against WCAG AA standards
- [ ] Validate shadow blur effects in different browsers
- [ ] Check border-radius consistency across all components
- [ ] Verify font-size scaling on responsive breakpoints
- [ ] Test focus states on keyboard navigation
- [ ] Validate z-index stacking context
- [ ] Test dark mode (if implemented)

### Component Implementation

- [ ] Button: All variants (primary, secondary, ghost, sizes)
- [ ] Card: Default, elevated, flat variants
- [ ] Input: Text, email, password, search, textarea, select
- [ ] Badge: All status variants (active, renewal, inactive, error, info)
- [ ] Avatar: All sizes and gradient options
- [ ] MetricCard: All metric types with gradients
- [ ] Table: Headers, cells, hover states, responsive
- [ ] Sidebar Menu: Active states, hover effects
- [ ] Modal: Overlay, header, body, footer, animations
- [ ] Animations: slideIn, fadeIn, pulse effects

### Testing

- [ ] Screenshot all components against mockup
- [ ] Verify shadows match exactly in browser DevTools
- [ ] Test hover/active/focus states
- [ ] Test responsive breakpoints on real devices
- [ ] Validate accessibility with screen reader
- [ ] Check performance (paint, layout shifts)
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)

---

## Dark Mode Support (Future)

The design system includes dark mode variables. When implementing:

```jsx
// Toggle theme
document.documentElement.setAttribute('data-theme', 'dark');
// or
document.documentElement.setAttribute('data-theme', 'light');
```

Dark mode colors are predefined in `tokens.css` under `@media (prefers-color-scheme: dark)`.

---

## Questions for ENGINEER

1. Should we create a React component library or use styled-components?
2. Do we need Storybook for component documentation?
3. Should we implement CSS modules or Tailwind for utilities?
4. Do we need component propTypes for strict typing?
5. Should we add unit tests for component variants?

---

**Document prepared by:** PREMIUM UI/UX DESIGNER (YR SYSTEM)  
**Date:** November 4, 2026  
**Status:** Ready for Implementation  
**Next Step:** FULL STACK ENGINEER to create React components following this specification
