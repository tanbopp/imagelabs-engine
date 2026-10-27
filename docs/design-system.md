# ImageLabs Design System & UX Reference

## 1. Brand Tokens

ImageLabs uses a clean, modern flat aesthetic. Visual hierarchy is established through high contrast, clean typography, and full-rounded geometry. Shadows and gradients are strictly excluded.

### Theme Color Palette

| Token | Light Mode | Dark Mode | Description |
| :--- | :--- | :--- | :--- |
| `--background` | `#ffffff` | `#0a0a0a` | Primary application canvas background |
| `--foreground` | `#0a0a0a` | `#fafafa` | Primary text and high-contrast foreground icons |
| `--muted` | `#f4f4f5` | `#171717` | Card surfaces, tool chips, and secondary backgrounds |
| `--muted-foreground` | `#71717a` | `#a1a1aa` | Secondary labels, descriptions, and metadata text |
| `--border` | `#e4e4e7` | `#262626` | Pure neutral gray borders and divider lines |
| `--accent` | `#0a0a0a` | `#fafafa` | High-emphasis interactive elements |
| `--accent-foreground` | `#ffffff` | `#0a0a0a` | Inverted text on accent surfaces |
| `--destructive` | `#ef4444` | `#dc2626` | Error states, cancel actions, and delete triggers |

*Note: Dark mode colors are pure neutral grays (`#0a0a0a`, `#171717`, `#262626`) with zero blue, slate, or zinc tint.*

### Radius & Elevation Tokens

| Token | Value | Tailwind Class | Application |
| :--- | :--- | :--- | :--- |
| `--radius-sm` | `0.5rem` (8px) | `rounded-lg` | Small tags, badges, input controls |
| `--radius-md` | `0.75rem` (12px) | `rounded-xl` | Inner containers, dropdown menus |
| `--radius-lg` | `1.0rem` (16px) | `rounded-2xl` | Cards, tool containers, upload zones |
| `--radius-full` | `9999px` | `rounded-full` | Action buttons, pill badges, search inputs |
| **Shadow** | `none` | `shadow-none` | **Globally applied: zero box-shadows anywhere** |

---

## 2. Typography

ImageLabs uses **Manrope** loaded locally via `@fontsource/manrope`.

### Font Weights
- `500` (Medium) — **Default weight** for body text, button labels, and descriptions.
- `600` (SemiBold) — Subheadings, card titles, table headers.
- `700` (Bold) — Primary page titles and hero banners.

### Typography Scale

| Class | Font Size | Line Height | Usage |
| :--- | :--- | :--- | :--- |
| `text-sm` | 14px (`0.875rem`) | 1.5 | Metadata, input labels, tooltips, quota meter details |
| `text-base` | 16px (`1.0rem`) | 1.5 | Primary body text, table cells, form inputs |
| `text-lg` | 18px (`1.125rem`) | 1.4 | Tool card titles, modal headings |
| `text-2xl` | 24px (`1.5rem`) | 1.2 | Section headings, tool dashboard headers |
| `text-4xl` | 36px (`2.25rem`) | 1.2 | Hero title, primary landing headlines |

---

## 3. Layout Grid

- **Desktop (≥ 1024px)**: 12-column layout with 24px gutters (`gap-6`). Maximum content container width of 1200px (`max-w-[1200px] mx-auto`).
- **Tablet (768px – 1023px)**: 8-column layout with 16px gutters (`gap-4`).
- **Mobile (< 768px)**: 4-column responsive vertical stack with 16px gutters and horizontal padding (`px-4`).

---

## 4. Component Catalog

### `<ToolCard>`
- **Purpose**: Displays an individual image tool with its icon, title, description, and link to tool workspace.
- **Underlying Primitive**: shadcn `Card` + `CardHeader` + `CardTitle` + `CardDescription`.
- **States**:
  - `Default`: Neutral border (`border-border`), muted background (`bg-muted/40`).
  - `Hover`: Highlighted border (`border-foreground`), smooth color transition.
  - `Focus`: Visible keyboard focus ring (`ring-2 ring-offset-2 ring-foreground`).
  - `Disabled`: Reduced opacity (`opacity-50`), pointer-events disabled.
  - `Loading`: Skeleton placeholder shimmer.
  - `Error`: Fallback error state if tool metadata fails to render.
  - `Empty`: Not applicable.

### `<UploadZone>`
- **Purpose**: Drag-and-drop file ingestion area supporting local file pickers and cloud imports.
- **Underlying Primitive**: shadcn `Card` with custom HTML5 drag-and-drop event listeners and hidden file input.
- **States**:
  - `Default`: Dashed border (`border-dashed border-2 border-border`), centered upload icon.
  - `Hover`: Solid border change, text contrast boost.
  - `Focus`: Focus outline on keyboard tab navigation.
  - `Disabled`: Grayed out, file picker disabled.
  - `Loading`: Active upload spinner with percentage counter.
  - `Error`: Red highlight border (`border-destructive`) with inline error explanation.
  - `Empty`: Initial state prompting user to drag images or browse.

### `<FileRow>`
- **Purpose**: Represents an individual queued or uploaded image in a batch queue.
- **Underlying Primitive**: shadcn `Card` (or `Table.Row`).
- **States**:
  - `Default`: Thumbnail preview, filename, dimensions, file size, action buttons (remove, reorder).
  - `Hover`: Action buttons illuminated.
  - `Focus`: Accessible row-level focus ring.
  - `Disabled`: Interaction lock during active processing.
  - `Loading`: Thumbnail loading skeleton.
  - `Error`: Warning badge showing unprocessable file warning.
  - `Empty`: Not applicable.

### `<BatchToolbar>`
- **Purpose**: Top or bottom action bar managing batch operations (sort, clear, execute).
- **Underlying Primitive**: shadcn `Button` + `DropdownMenu`.
- **States**:
  - `Default`: Primary execution button ("Process X Images"), sort toggle dropdown.
  - `Hover`: Primary button hover contrast.
  - `Focus`: Keyboard focus ring on action buttons.
  - `Disabled`: Inactive when queue is empty or processing.
  - `Loading`: Loading spinner on execute button with pending batch state.
  - `Error`: Feedback badge if batch parameters are invalid.
  - `Empty`: Hidden when no files are selected.

### `<JobProgress>`
- **Purpose**: Displays the active progress and current execution stage of a processing job.
- **Underlying Primitive**: shadcn `Progress`.
- **States**:
  - `Default`: Linear progress bar with percentage indicator and stage label.
  - `Hover`: Displays detailed elapsed time tooltip.
  - `Focus`: Programmatic focus for screen reader announcements.
  - `Disabled`: Inactive.
  - `Loading`: Animated progress bar pulse.
  - `Error`: Red progress bar fill (`bg-destructive`) with failed stage notice.
  - `Empty`: Zero percent state.

### `<ResultView>`
- **Purpose**: Shows the completed image output with download actions, file size reduction stats, and next-step actions.
- **Underlying Primitive**: shadcn `Card` + `Button`.
- **States**:
  - `Default`: Side-by-side or before/after comparison, single/zip download buttons.
  - `Hover`: Action button highlight.
  - `Focus`: Standard keyboard focus ring.
  - `Disabled`: Download buttons disabled if presigned link expired.
  - `Loading`: Output asset hydration state.
  - `Error`: Download failure message with retry button.
  - `Empty`: Initialized before job output is resolved.

### `<QuotaMeter>`
- **Purpose**: Compact visual gauge showing daily processed images and bandwidth consumed against session limits.
- **Underlying Primitive**: shadcn `Progress` + `Tooltip`.
- **States**:
  - `Default`: Subtle circular or linear progress meter with numerical counter (`4 / 20 jobs used`).
  - `Hover`: Informative tooltip displaying reset countdown timer (`Resets at midnight UTC`).
  - `Focus`: Focusable via keyboard to read quota via screen readers.
  - `Disabled`: Inactive.
  - `Loading`: Skeleton loader during quota fetch.
  - `Error`: Displays warning icon if quota endpoint fails.
  - `Empty`: Shows 0% usage for new sessions.

### `<ThemeToggle>`
- **Purpose**: Switches between Light and Dark interface themes.
- **Underlying Primitive**: shadcn `Toggle` (or `Button` variant).
- **States**:
  - `Default`: Shows Sun or Moon icon.
  - `Hover`: Background brightness shift.
  - `Focus`: Focus ring.
  - `Disabled`: Disabled during active transitions.
  - `Loading`: Hidden or locked.
  - `Error`: Not applicable.
  - `Empty`: Not applicable.

### `<ConfirmDialog>`
- **Purpose**: Modal confirmation before irreversible actions (e.g., clearing an entire batch or aborting a running job).
- **Underlying Primitive**: shadcn `AlertDialog`.
- **States**:
  - `Default`: Centered modal with header, descriptive message, cancel button, and destructive action button.
  - `Hover`: Standard button hover.
  - `Focus`: Trapped modal focus with initial focus on the Cancel button.
  - `Disabled`: Buttons locked during pending abort.
  - `Loading`: Spinners inside action buttons.
  - `Error`: Inline error if action fails.
  - `Empty`: Closed state.

---

## 5. Icon Set

- **Library**: `lucide-react` exclusively.
- **Standard Sizes**:
  - Small: `16px` (`size-4`) for inline badges, table actions, and meta tags.
  - Medium: `20px` (`size-5`) for standard buttons, form inputs, and nav items.
  - Large: `24px` (`size-6`) for tool card headers and hero highlights.
- **Icon Style**: Clean line icons only. Never use solid or filled variants for action triggers.

---

## 6. Motion & Micro-interactions

- **Subtle & Fast**: No bouncy spring physics or delayed animations.
- **Transitions**: Strictly limited to `transition-colors` and `transition-opacity` with a default duration of 150ms (`duration-150 ease-in-out`).
- **Zero Elevation**: Never translate cards or buttons on the Y-axis (no `translate-y-[-2px]`), and never apply hover drop-shadows.

---

## 7. Accessibility Checklist

- **Keyboard Navigation**: Every interactive element (buttons, cards, inputs, dropdowns) must be navigable via standard `Tab` and `Shift+Tab`.
- **Focus Rings**: Universal visible focus indicator using `ring-2 ring-offset-2 ring-foreground focus-visible:outline-none`.
- **Icon Buttons**: Every icon-only button must have an explicit `aria-label` describing the action (e.g., `<Button aria-label="Rotate image 90 degrees clockwise">`).
- **Form Association**: All inputs must be explicitly wrapped or associated with a `<Label htmlFor="...">`.
- **Color Contrast**: Foreground text against background surfaces must maintain a minimum contrast ratio of 4.5:1 (WCAG AA).
- **ARIA Live Regions**: Live announcements configured for job progress changes and batch completion notifications using `aria-live="polite"`.

---

## 8. Do / Don't Examples

### Example 1: Button Styling & Shadows

```tsx
// DO: Flat design, full-rounded geometry, no shadows, explicit focus ring
<button className="rounded-full bg-foreground text-background px-6 py-2.5 font-medium transition-colors hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 shadow-none">
  Compress Images
</button>

// DON'T: Box shadows, subtle rounding, or hover elevation
<button className="rounded-md bg-blue-600 text-white px-4 py-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
  Compress Images
</button>
```

### Example 2: Card Containers & Colors

```tsx
// DO: Neutral pure gray border, 2xl radius, no elevation, flat surface
<div className="rounded-2xl border border-border bg-muted/30 p-6 shadow-none transition-colors hover:border-foreground">
  <h3 className="text-lg font-semibold text-foreground">Resize Batch</h3>
</div>

// DON'T: Colored tint borders, low radius, drop shadow
<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-md hover:shadow-cyan-500/50">
  <h3 className="text-lg font-semibold text-slate-900">Resize Batch</h3>
</div>
```

### Example 3: Icon-Only Action Buttons

```tsx
// DO: Explicit aria-label, proper icon sizing, rounded-full, flat hover
<button 
  type="button" 
  aria-label="Remove image from queue"
  className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-foreground"
>
  <Trash2 className="size-4" />
</button>

// DON'T: Missing aria-label, filled icon, unstyled button
<button className="p-1 hover:text-red-500">
  <Trash2Filled className="w-5 h-5" />
</button>
```
