# Phase 11: Cloud Import & Export (Google Drive & Dropbox)

## 1. Phase Title & Goal
- **Phase Title**: Phase 11 — Cloud Import & Export Integration (`Google Drive`, `Dropbox`).
- **Goal**: Enable frictionless cloud storage workflows allowing users to import image files directly from Google Drive and Dropbox into the ImageLabs processing pipeline, as well as export processed deliverables back to their cloud accounts. All OAuth authentication tokens reside strictly in client memory with zero server-side storage.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on Phase 01 (UI design tokens, buttons), Phase 02 (Stateless session auth), and Phase 03 (Presigned S3 upload pipeline).
- **Architecture Note**: Follows the client-centric pattern: Browser authenticates via OAuth popup $\rightarrow$ downloads asset to browser memory/Blob $\rightarrow$ uploads to S3 via standard presigned URL. The backend API never handles or stores third-party OAuth refresh tokens.

---

## 3. Scope

### In-Scope
- Google Drive Integration:
  - Google Identity Services (GIS) Token Client flow for in-browser authentication.
  - Google Drive Picker API integration for selecting images.
  - Client-side fetch of chosen images and hand-off to `<UploadZone>`.
  - Google Drive Export: Direct upload of completed output files back to user's Google Drive.
- Dropbox Integration:
  - Dropbox Chooser API for selecting images from Dropbox.
  - Dropbox Saver API for saving completed deliverables back to Dropbox with a single click.
- UI Controls:
  - Google Drive and Dropbox action buttons integrated into `<UploadZone>` and `<ResultView>`.
  - Cloud progress indicator during remote download and transfer.

### Out-of-Scope
- Server-to-server cloud synchronization (all operations are client-orchestrated).
- Persistent storage of user OAuth credentials or cloud account mappings.
- Non-image file imports (filtered directly within Cloud Pickers).

---

## 4. Tech Stack & Libraries
- **Google SDKs**: `@types/google.accounts`, Google API Client (`gapi`), Google Identity Services (`gis`).
- **Dropbox SDKs**: Dropbox Chooser and Saver client scripts (`https://www.dropbox.com/static/api/2/dropins.js`).
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui (`Button`, `Dialog`, `DropdownMenu`).

---

## 5. Files to Create / Modify
- `apps/web/src/lib/cloud/google-drive.ts`: Google Drive Auth and Picker API wrapper.
- `apps/web/src/lib/cloud/dropbox.ts`: Dropbox Chooser and Saver wrapper.
- `apps/web/src/components/cloud/cloud-import-buttons.tsx`: Google Drive / Dropbox trigger buttons.
- `apps/web/src/components/cloud/cloud-export-menu.tsx`: Export dropdown menu in result views.
- `apps/web/src/components/upload/upload-zone.tsx`: Integrate cloud trigger buttons into upload area.
- `apps/web/src/features/common/components/result-view.tsx`: Integrate cloud export actions.

---

## 6. Detailed Requirements

### 6.1 Google Drive Import & Export
1. **Script Ingestion**: Dynamically load `https://accounts.google.com/gsi/client` and `https://apis.google.com/js/api.js`.
2. **Import Flow**:
   - User clicks "Google Drive" button.
   - Request OAuth token with scope `https://www.googleapis.com/auth/drive.file`.
   - Launch Google Picker configured with `google.picker.ViewId.DOCS_IMAGES`.
   - On file selection: Retrieve file metadata, fetch binary blob using `Authorization: Bearer <accessToken>`, and pass Blob to ImageLabs `uploadFileDirectly(blob, filename)` pipeline.
3. **Export Flow**:
   - Request OAuth token.
   - Fetch processed result Blob from S3 presigned download URL.
   - Dispatch `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart` to write file directly to user's root Drive or "ImageLabs" folder.

### 6.2 Dropbox Chooser & Saver
1. **Script Ingestion**: Load Drop-in script with `data-app-key`.
2. **Chooser Flow**:
   - Trigger `Dropbox.choose({ success: (files) => { ... }, linkType: 'direct', multiselect: true, extensions: ['.jpg', '.png', '.webp', '.gif'] })`.
   - Fetch image from direct link as Blob, dispatch to ImageLabs S3 upload pipeline.
3. **Saver Flow**:
   - Trigger `Dropbox.save(downloadUrl, filename)`.
   - Dropbox infrastructure pulls file directly from S3 presigned URL into user's account.

---

## 7. UI Specification
- Embedded within `<UploadZone>`:
  - Clean secondary buttons with official brand icons: "Google Drive" and "Dropbox".
  - Hover states matching brand colors (`hover:bg-[#4285F4]/10` for Google, `hover:bg-[#0061FF]/10` for Dropbox).
- Embedded within `<ResultView>`:
  - Split button or dropdown menu attached to the main Download button: "Save to Google Drive", "Save to Dropbox".
  - Success toast notification upon cloud export completion.

---

## 8. API / Data Contract
- No additional backend endpoints required. All operations authenticate against third-party OAuth providers client-side and interact with standard `/api/upload` routes.

---

## 9. Security & Privacy
- **Zero Token Persistence**: Access tokens are kept strictly in JavaScript runtime memory and never saved to `localStorage`, `sessionStorage`, or server cookies.
- **Minimal Scopes**: Google Drive requests `drive.file` scope only (grants access solely to files opened or created by ImageLabs, never accessing the user's wider Drive contents).
- **Environment Configuration**: Client IDs are exposed via `VITE_GOOGLE_CLIENT_ID` and `VITE_DROPBOX_APP_KEY`. Secrets are never bundled on the client.

---

## 10. Performance
- Streaming transfers: Browser streams downloaded Blobs directly to S3 without unnecessary memory duplications.
- Cloud Picker loading latency: $< 500\text{ ms}$ on script pre-warming.

---

## 11. Step-by-Step Implementation Order
1. Implement script loader utilities for Google and Dropbox SDKs in `apps/web/src/lib/cloud/`.
2. Build Google Drive authentication and Picker trigger hook.
3. Build Dropbox Chooser and Saver hooks.
4. Implement `CloudImportButtons` and integrate into `<UploadZone>`.
5. Implement `CloudExportMenu` and integrate into `<ResultView>`.
6. Test end-to-end import and export flows with test Google/Dropbox sandbox accounts.

---

## 12. Acceptance Criteria
- [ ] Clicking Google Drive opens the Google Picker dialog for images.
- [ ] Selected Google Drive images are downloaded, sent to S3, and populate the processing queue.
- [ ] Dropbox Chooser allows selecting images with direct import into the workspace.
- [ ] Processed output images can be saved directly back to Google Drive or Dropbox without local disk download.
- [ ] Zero OAuth tokens are sent to or stored in ImageLabs backend servers or Redis.

---

## 13. Test Scenarios
- Test: Select 2 PNG files via Dropbox Chooser $\rightarrow$ verify both appear in the ImageLabs file queue.
- Test: Click "Save to Google Drive" on result screen $\rightarrow$ verify multipart upload executes successfully.
- Test: Reject OAuth consent popup $\rightarrow$ verify UI handles cancellation gracefully without error toasts.

---

## 14. Definition of Done
- Both cloud providers fully functional in production builds.
- Strict security adherence with zero server-side token storage.
- TypeScript typing and lint checks complete with zero errors.
