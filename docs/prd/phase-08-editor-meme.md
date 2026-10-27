# Phase 08: Client-Side Canvas Editor & Meme Generator

## 1. Phase Title & Goal
- **Phase Title**: Phase 08 — Client-Side Canvas Editor & Meme Generator (`image-editor`, `meme-generator`).
- **Goal**: Implement zero-latency, in-browser creative editing workflows using HTML5 Canvas and Fabric.js. Deliver a full-featured raster/vector canvas image editor (annotations, shapes, text, filters, layer ordering) and a classic meme generator (Impact font, text wrapping, high-contrast outlines). Completed outputs are exported client-side and saved to temporary S3 storage via standard presigned uploads.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on Phase 01 (Design system & UI primitives), Phase 02 (Stateless session auth), and Phase 03 (Presigned S3 upload pipeline).
- **Architecture Note**: Both tools execute entirely in the client browser. No backend worker queues or compute resources are consumed.

---

## 3. Scope

### In-Scope
- `image-editor`:
  - Canvas engine built with Fabric.js v5/v6.
  - Adding and styling text, geometric shapes (rectangle, circle, arrow, line), and freehand drawing (brush).
  - Basic image adjustments/filters (brightness, contrast, grayscale, sepia, invert).
  - Object manipulation: Drag, scale, rotate, z-index reordering (bring to front/send to back).
  - Undo / Redo history state stack.
  - Client-side export to PNG or JPG and direct upload to S3.
- `meme-generator`:
  - Template selector (preset memes or custom user upload).
  - Top text and Bottom text inputs with automatic text wrapping and uppercase styling.
  - Authentic meme typography: Impact font with black stroke outline and white fill.
  - Instant client-side canvas rendering and export.

### Out-of-Scope
- Multi-user collaborative canvas editing.
- Video / animated GIF meme creation (static images only).
- Server-side worker processing (client-side only).

---

## 4. Tech Stack & Libraries
- **Canvas Framework**: Fabric.js (v5.3+ / v6+).
- **Fonts**: Local Impact font / Google Font fallbacks loaded via CSS `@font-face`.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui (`Button`, `Slider`, `Input`, `Tabs`, `Dialog`).
- **Storage**: Direct-to-S3 presigned PUT via `@imagelabs/shared` schemas.

---

## 5. Files to Create / Modify
- `apps/web/src/features/editor/pages/editor-page.tsx`: Full canvas editor workspace.
- `apps/web/src/features/editor/components/canvas-workspace.tsx`: Fabric.js canvas wrapper.
- `apps/web/src/features/editor/components/editor-toolbar.tsx`: Tool controls (shapes, text, brush, filters).
- `apps/web/src/features/editor/hooks/use-fabric-history.ts`: Undo/redo history manager.
- `apps/web/src/features/meme/pages/meme-page.tsx`: Meme generator workspace.
- `apps/web/src/features/meme/components/meme-canvas.tsx`: High-performance meme renderer.
- `apps/web/src/features/meme/components/meme-controls.tsx`: Text inputs and font sizing controls.

---

## 6. Detailed Requirements

### 6.1 Fabric.js Image Editor (`<ImageEditor>`)
- Canvas initializes to match loaded image aspect ratio and scales responsively to fit the viewport.
- **Tools**:
  - `Select`: Move, scale, and rotate objects.
  - `Draw`: Freehand drawing pencil/brush with customizable color and width.
  - `Text`: Add editable text layer with font family, size, weight, and color settings.
  - `Shapes`: Add Rectangle, Circle, Line, or Arrow overlays.
  - `Filters`: Apply WebGL-accelerated Fabric filters (Brightness, Contrast, Grayscale, Blur).
- **History Management**: Stack of serialized JSON states (maximum 20 history steps) for Undo/Redo.
- **Export Flow**:
  1. Call `canvas.toDataURL({ format: 'png', quality: 1.0 })`.
  2. Convert data URL to Blob.
  3. Call `POST /api/upload` to obtain a presigned PUT URL.
  4. Upload Blob to S3 `inputs/uuid/edited-image.png`.
  5. Provide download link directly to user.

### 6.2 Meme Generator (`<MemeGenerator>`)
- Custom canvas implementation optimized for rapid meme creation:
  - Top Text and Bottom Text inputs.
  - Automatic line wrapping based on canvas width.
  - Authentic typography: `Impact, sans-serif`, font size dynamically computed, uppercase transformation, `fillStyle = '#ffffff'`, `strokeStyle = '#000000'`, `lineWidth = fontSize / 8`.
- Live rendering on every keystroke with zero input lag.
- Quick export to high-res JPG or PNG.

---

## 7. UI Specification
- **Editor Workspace**: Full-height application view with dark canvas background (`#171717`).
  - Left Sidebar: Tool selector icons (`Select`, `Brush`, `Text`, `Shapes`, `Filters`).
  - Top Bar: Undo, Redo, Zoom controls, and prominent "Save & Download" button.
  - Right Sidebar: Properties inspector for selected active object (color, stroke, opacity, z-order).
- **Meme Workspace**: Side-by-side layout:
  - Left / Main: Live meme canvas preview.
  - Right: Control panel with Top Text, Bottom Text, font size sliders, and template selection grid.

---

## 8. API / Data Contract
- Uses standard upload endpoints:
  - `POST /api/upload` to store exported blobs into S3.
  - Emits standard `UploadResponse` `{ uploadUrl, s3Key, expiresAt }`.

---

## 9. Security & Validation
- **Canvas Taint Prevention**: All remote images loaded into Fabric.js or Canvas must have `crossOrigin = 'anonymous'` to prevent tainted canvas security exceptions when exporting.
- **Memory Management**: Dispose Fabric canvas instances on React unmount (`canvas.dispose()`) to eliminate memory leaks.

---

## 10. Performance
- 60 FPS smooth rendering during object dragging, resizing, and brush drawing.
- Meme text re-render latency: $< 16\text{ ms}$ on keystrokes.
- Export to Blob and upload initialization: $< 500\text{ ms}$.

---

## 11. Step-by-Step Implementation Order
1. Build `useFabricHistory` hook managing canvas undo/redo states.
2. Build `CanvasWorkspace` encapsulating Fabric.js canvas initialization and responsive sizing.
3. Implement `EditorToolbar` with brush, shape, and text injection controls.
4. Implement filter manipulation handlers (Brightness, Contrast, Grayscale).
5. Implement client-side export and S3 presigned upload pipeline.
6. Build `MemeCanvas` with Impact font text wrapping and black stroke outline rendering.
7. Build `MemeControls` and assemble `MemePage`.

---

## 12. Acceptance Criteria
- [ ] Users can draw freehand, insert text, and add shapes onto uploaded images.
- [ ] Undo and redo reliably traverse canvas state changes.
- [ ] Export produces a sharp PNG/JPG matching canvas dimensions.
- [ ] Meme generator wraps multi-line captions and applies authentic white text with black outline.
- [ ] No server workers or databases are queried; processing is 100% client-side.

---

## 13. Test Scenarios
- Test: Add text object, update fill color $\rightarrow$ canvas reflects color change.
- Test: Trigger Undo after moving a shape $\rightarrow$ shape returns to previous coordinates.
- Test: Export meme with long sentence $\rightarrow$ verify text wraps across lines without overflowing canvas borders.

---

## 14. Definition of Done
- Editor and Meme generator fully functional in modern browsers.
- Zero memory leaks detected upon route navigation.
- Passes all ESLint rules and TypeScript typechecks.
