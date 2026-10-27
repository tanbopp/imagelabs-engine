# Phase 10: HTML to Image Rendering Service

## 1. Phase Title & Goal
- **Phase Title**: Phase 10 — HTML to Image Rendering Service (`html-to-image`).
- **Goal**: Implement a sandboxed, headless Chromium rendering service using Puppeteer inside the dedicated Puppeteer Worker. Deliver high-fidelity raster capture of raw HTML strings and live web URLs, complete with viewport scaling, full-page capture options, and an integrated in-browser code editor.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on Phase 00 (Worker package layout), Phase 02 (Stateless session auth), Phase 03 (S3 presigned pipeline), and Phase 04 (BullMQ `puppeteer-jobs` queue).
- **Consumes**: `JobCreateRequestSchema` and `JobResponseSchema` from `@imagelabs/shared`.

---

## 3. Scope

### In-Scope
- Dedicated Puppeteer Worker (`workers/puppeteer`):
  - Headless Chromium runner with sandboxed execution.
  - Rendering raw HTML/CSS strings or navigating to public HTTP/HTTPS URLs.
  - Viewport configurations (Desktop 1920x1080, Tablet 768x1024, Mobile 375x667).
  - Full-page screenshot or viewport-only capture.
  - Export output format: PNG or JPEG with quality controls.
- Frontend HTML Workspace:
  - Code editor (e.g., CodeMirror / Monaco lightweight wrapper) with HTML syntax highlighting.
  - URL input field with automatic preview toggle.
  - Viewport dimension selectors and full-page toggle.

### Out-of-Scope
- PDF generation (ImageLabs is strictly image-focused).
- Interactive session recording or video capture.
- Rendering pages requiring authenticated logins or internal intranet access.

---

## 4. Tech Stack & Libraries
- **Worker Engine**: Node.js + `puppeteer` (or `puppeteer-core` with Chromium Alpine).
- **Queue**: BullMQ consuming from `puppeteer-jobs`.
- **Frontend**: React 18, `@uiw/react-codemirror` (HTML language support), Tailwind CSS, shadcn/ui.

---

## 5. Files to Create / Modify
- `workers/puppeteer/src/index.ts`: Worker entrypoint and queue listener.
- `workers/puppeteer/src/processors/html-to-image.ts`: Puppeteer browser lifecycle and capture processor.
- `workers/puppeteer/src/lib/browser-pool.ts`: Chromium instance management and resource reuse.
- `packages/shared/src/schemas/tool-options.schema.ts`: Add `HtmlToImageOptionsSchema`.
- `apps/web/src/features/html-to-image/pages/html-to-image-page.tsx`: Main route view.
- `apps/web/src/features/html-to-image/components/html-code-editor.tsx`: Code editor component.
- `apps/web/src/features/html-to-image/components/viewport-controls.tsx`: Dimension and format selectors.

---

## 6. Detailed Requirements

### 6.1 Option Schema
```typescript
export const HtmlToImageOptionsSchema = z.object({
  sourceType: z.enum(['html', 'url']),
  html: z.string().max(500000).optional(), // Max 500 KB raw markup
  url: z.string().url().optional(),
  format: z.enum(['png', 'jpeg']).default('png'),
  quality: z.number().int().min(1).max(100).default(90),
  viewport: z.object({
    width: z.number().int().min(320).max(3840).default(1280),
    height: z.number().int().min(240).max(2160).default(800),
    deviceScaleFactor: z.number().min(1).max(3).default(1),
  }).default({ width: 1280, height: 800, deviceScaleFactor: 1 }),
  fullPage: z.boolean().default(false),
  delayMs: z.number().int().min(0).max(5000).default(500), // Wait for animations
}).refine((data) => (data.sourceType === 'html' ? !!data.html : !!data.url), {
  message: 'Must provide html content or a valid url based on sourceType',
});
```

### 6.2 Puppeteer Execution Logic
1. Acquire browser page from browser pool.
2. Set viewport dimensions and device scale factor.
3. Apply strict sandbox flags:
   - `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`.
4. If `sourceType === 'html'`:
   - Set content: `await page.setContent(options.html, { waitUntil: 'networkidle0', timeout: 15000 })`.
5. If `sourceType === 'url'`:
   - Navigate: `await page.goto(options.url, { waitUntil: 'networkidle2', timeout: 20000 })`.
6. Wait for requested `delayMs` for layout stability.
7. Capture screenshot:
   ```typescript
   const buffer = await page.screenshot({
     type: options.format,
     quality: options.format === 'jpeg' ? options.quality : undefined,
     fullPage: options.fullPage,
   });
   ```
8. Close page, upload result buffer to S3, and mark job completed.

---

## 7. UI Specification
- Mode Switcher: Tabs for "Raw HTML Snippet" vs "Website URL".
- Code Editor Tab: Full-featured CodeMirror editor pre-filled with clean HTML/CSS boilerplate.
- Viewport Bar: Presets for `Desktop (1920x1080)`, `Laptop (1280x800)`, `Mobile (375x667)`, and custom inputs.
- "Full Page Capture" toggle switch.
- Action Button: "Render & Download Image" with loading spinner during worker execution.

---

## 8. API / Data Contract
- **Route**: `POST /api/jobs`
- **Body**:
  ```json
  {
    "tool": "html-to-image",
    "inputs": [],
    "options": {
      "sourceType": "html",
      "html": "<div style='background: #000; color: #fff; padding: 40px;'><h1>ImageLabs HTML</h1></div>",
      "format": "png",
      "viewport": { "width": 1280, "height": 720, "deviceScaleFactor": 2 },
      "fullPage": false
    }
  }
  ```

---

## 9. Security & Sandboxing (CRITICAL)
- **SSRF Prevention**: If `sourceType === 'url'`, block internal network IPs (e.g., `127.0.0.1`, `localhost`, `169.254.169.254`, `10.0.0.0/8`, `192.168.0.0/16`). Reject requests to private IP ranges.
- **Content Security Policy (CSP)**: When rendering raw HTML, inject a strict CSP meta header disallowing requests to local filesystem (`file://`) and disabling outgoing sockets.
- **Resource Constraints**: Limit browser page navigation timeout to 20 seconds. Force kill hung tabs to avoid memory exhaustion.

---

## 10. Performance
- Reusable Chromium browser pool to eliminate cold start overhead ($< 1.5\text{s}$ per render).
- Concurrency limit: Maximum 5 concurrent tabs per Puppeteer worker container.

---

## 11. Step-by-Step Implementation Order
1. Scaffold `workers/puppeteer` with Docker and Chromium runtime dependencies.
2. Implement `browser-pool.ts` to manage Chromium process lifecycles.
3. Build `html-to-image.ts` processor with SSRF guards and screenshot capture logic.
4. Hook processor to `puppeteer-jobs` queue in BullMQ.
5. Build CodeMirror HTML editor component in `apps/web`.
6. Implement URL input with SSRF pre-validation feedback.
7. Integrate end-to-end rendering and test against complex HTML5 fixtures.

---

## 12. Acceptance Criteria
- [ ] Raw HTML strings render with proper CSS styling, fonts, and inline styles.
- [ ] Full-page screenshot correctly captures long scrollable pages from top to bottom.
- [ ] Requests to `http://localhost:3000` or `http://169.254.169.254` are blocked with `INVALID_INPUT`.
- [ ] Hung pages terminate cleanly after 20-second timeout without crashing the worker process.

---

## 13. Test Scenarios
- Test: Render HTML with CSS flexbox layout $\rightarrow$ verify PNG output dimensions match.
- Test: Attempt to load `file:///etc/passwd` via HTML iframe $\rightarrow$ verify blocked by CSP sandbox.
- Test: Render URL with fullPage toggle $\rightarrow$ verify output height matches page document scrollHeight.

---

## 14. Definition of Done
- Dedicated Puppeteer worker runs cleanly in Docker.
- Strict SSRF and security sandbox verified.
- Passes all TypeScript and lint checks.
