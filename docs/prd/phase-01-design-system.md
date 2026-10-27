# Phase 01: Design System & UI Shell Foundation

## 1. Phase Title & Goal
- **Phase Title**: Phase 01 — Design System & UI Shell Foundation.
- **Goal**: Establish the complete visual identity, theme tokens, and reusable component foundation in `apps/web`. Implement Tailwind CSS, official shadcn/ui primitives, the Manrope font family, neutral dark mode, responsive application shell (Header, Footer, Navigation), and the comprehensive Tool Grid Dashboard displaying all 14 ImageLabs tools.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on Phase 00 (Monorepo scaffolding, `@imagelabs/shared` tools catalog, packages layout).
- **Consumes**: `TOOLS` and `TOOL_CATEGORIES` constants from `@imagelabs/shared`.

---

## 3. Scope

### In-Scope
- Setup Tailwind CSS with custom design tokens from `docs/design-system.md` (no shadows, full-rounded radius, neutral grays).
- Setup self-hosted Manrope font (`@fontsource/manrope`, default weight 500).
- Installation and configuration of core shadcn/ui primitives via CLI (`Button`, `Card`, `Badge`, `Toggle`, `DropdownMenu`, `Tooltip`).
- Development of core layout shell:
  - `<Header>` with brand logo, nav links, and theme toggle.
  - `<Footer>` with privacy badges, links, and copyright notices.
  - `<ThemeToggle>` supporting light, dark, and system preference with zero tint pure neutral grays.
- Implementation of the central `<ToolGrid>` and `<ToolCard>` components rendering all 14 ImageLabs tools grouped by category (Optimization, Conversion, Basic Editing, Advanced & AI).

### Out-of-Scope
- Functional backend API integration (mock links/routes only for this phase).
- Functional upload or processing logic inside tool workspaces.

---

## 4. Tech Stack & Libraries
- **Framework**: React 18 + Vite + TypeScript.
- **Styling**: Tailwind CSS + `clsx` + `tailwind-merge` (`cn` helper).
- **Icons**: `lucide-react` exclusively.
- **UI Primitives**: shadcn/ui (Radix UI headless primitives).
- **Fonts**: `@fontsource/manrope`.

---

## 5. Files to Create / Modify
- `apps/web/tailwind.config.ts`: Extend theme with pure neutral colors, radius tokens, and zero shadows.
- `apps/web/src/styles/globals.css`: Root CSS custom properties and `@layer base` rules.
- `apps/web/src/lib/utils.ts`: `cn()` class merge utility.
- `apps/web/src/components/ui/*`: shadcn primitives installed via CLI.
- `apps/web/src/components/layout/header.tsx`: Global navigation header.
- `apps/web/src/components/layout/footer.tsx`: Global footer.
- `apps/web/src/components/layout/app-shell.tsx`: Main layout wrapper.
- `apps/web/src/components/common/theme-toggle.tsx`: Light/dark toggle.
- `apps/web/src/components/tools/tool-card.tsx`: Individual tool card.
- `apps/web/src/components/tools/tool-grid.tsx`: Categorized tool layout.
- `apps/web/src/pages/home-page.tsx`: Landing view hosting hero and tool grid.

---

## 6. Detailed Requirements

### 6.1 Theme & Token Configuration
- Configure `globals.css` with exact tokens:
  - `--background`: `#ffffff` (light), `#0a0a0a` (dark).
  - `--foreground`: `#0a0a0a` (light), `#fafafa` (dark).
  - `--muted`: `#f4f4f5` (light), `#171717` (dark).
  - `--border`: `#e4e4e7` (light), `#262626` (dark).
  - All radius tokens: `0.5rem`, `0.75rem`, `1.0rem`, `9999px`.
  - Global CSS rule: `* { box-shadow: none !important; }` or Tailwind class `shadow-none` default.

### 6.2 Tool Card Component (`<ToolCard>`)
- Consumes `ToolMeta` from `@imagelabs/shared`.
- Displays dynamic Lucide icon matching `tool.icon`.
- Fully rounded container (`rounded-2xl`), border `border-border`, hover state `hover:border-foreground`.
- Displays badge for AI-powered tools (`requiresAI: true`).
- Keyboard accessible with explicit focus ring (`ring-2 ring-offset-2 ring-foreground`).

### 6.3 Tool Grid (`<ToolGrid>`)
- Displays tools segmented into 4 ordered categories: Optimization, Conversion, Basic Editing, Advanced & AI.
- Responsive grid: 1 column on mobile, 2 columns on tablet, 3-4 columns on desktop.

---

## 7. UI Specification
- Visual appearance strictly adheres to `docs/design-system.md`.
- No shadows or 3D elevation effects anywhere.
- Transitions limited to 150ms `transition-colors` and `transition-opacity`.
- Hero section: Bold Manrope typography ("Fast, Private, In-Browser Image Tools. No Accounts. No Database.").

---

## 8. API / Data Contract
- N/A for Phase 01 (Static frontend layout consuming `@imagelabs/shared`).

---

## 9. Security & Validation
- Semantic HTML tags (`<header>`, `<main>`, `<nav>`, `<footer>`, `<section>`).
- All interactive buttons have accessible names or `aria-label` attributes.
- WCAG AA contrast ratio (> 4.5:1) verified in both light and dark modes.

---

## 10. Performance
- Zero layout shift (CLS < 0.05).
- First Contentful Paint (FCP) < 0.8s on standard broadband.
- Local Manrope font bundling without external render-blocking network requests.

---

## 11. Step-by-Step Implementation Order
1. Configure `tailwind.config.ts` and `globals.css` with the design tokens.
2. Import `@fontsource/manrope` in `main.tsx` and verify font family override.
3. Install shadcn primitives (`card`, `button`, `badge`, `toggle`, `tooltip`).
4. Build `ThemeToggle` component with localStorage persistence and system preference sync.
5. Build `Header` and `Footer` layout components.
6. Build `ToolCard` and `ToolGrid` rendering the 14 tools from `@imagelabs/shared`.
7. Assemble `AppShell` and render landing page in `apps/web`.

---

## 12. Acceptance Criteria
- [ ] Dark mode toggles cleanly with neutral pure grays (`#0a0a0a`, `#171717`, `#262626`) and zero blue hue.
- [ ] All 14 tools from `packages/shared/src/constants/tools.ts` render with correct icons and categories.
- [ ] No element in the DOM has a CSS box-shadow.
- [ ] Focus rings are visible when navigating entirely via keyboard.
- [ ] Responsive behavior displays correctly across mobile (375px), tablet (768px), and desktop (1280px).

---

## 13. Test Scenarios
- Component test: Verify `ToolGrid` renders 14 instances of `ToolCard`.
- Unit test: Verify `ThemeToggle` updates `document.documentElement.classList` with `dark`.
- Accessibility test: Run axe-core automated audit on the homepage view.

---

## 14. Definition of Done
- Clean visual finish matching the flat design system.
- Code passes lint and typecheck.
- Ready for backend session integration in Phase 02.
