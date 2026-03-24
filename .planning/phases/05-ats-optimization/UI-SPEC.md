# UI-SPEC: Phase 05 — ATS & Learning Loop

## 🎨 Theme: "Origin Command" Solid Modern
**Aesthetic**: High-contrast dark surfaces (Charcoal/Deep Black), 1px solid borders, vibrant cyan accents for hierarchy, no translucency.

## 🧩 New Component: `StudyGuideTab`
**Location**: `ReviewPage.jsx` > Detail Drawer
**Layout**:
- **Structure**: Solid card containers with `border: 1px solid #333`.
- **Skill Gaps**: A vertical list of badges. Solid background colors (Red for gap, Cyan for match).
- **Business Context**: High-contrast blockquote with a "Globe" icon.
- **Research Prompts**: A check-list of 3 items. Clicking an item marks it as "Learned" (client-side only).

## 🧩 Component Update: `JobCard` & `JobDetail`
- **ATS Badge**: A sleek, circular gauge or a high-gloss badge (e.g., `ATS 82%`).
- **Optimization status**: 
  - `INITIAL`: "Analyze for ATS" button.
  - `OPTIMIZING`: A pulsanting cyan ring with percentage.
  - `READY`: "Ready to Submit" (Glow effect).

## 🧩 Component Update: `ApplicationQueue`
- **Gatekeeper Warning**: A "Red Alert" toast or inline banner if a user tries to apply with an ATS score < 75.
- **One-Click Fix**: A button that triggers the `optimize-resume` API directly from the warning.

## 🎞️ Micro-Animations
- **Tab Switching**: Smooth horizontal slide (X-axis).
- **Optimization progress**: Smooth incrementing number (Count-up).
- **Badge Reveal**: Fade-in with a slight upward scale (Y-axis).

---
**Status**: DESIGN READY for Implementation.
