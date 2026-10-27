# ImageLabs Architecture Blueprint

## 1. Overview & Purpose

ImageLabs is a fast, privacy-first, fully functional clone of iLoveIMG (https://www.iloveimg.com/) with a clean brand and independent visual identity. The platform provides a suite of image optimization, conversion, editing, and AI-powered manipulation tools directly to users through an intuitive, accessible web interface.

### The No-Database Constraint & Ephemeral State Model
ImageLabs operates under a strict architectural design constraint: **No persistent relational or document database** (no PostgreSQL, MySQL, MongoDB, Prisma, or persistent user accounts). 

- **Ephemeral Storage**: All application state resides exclusively in Redis with hard TTLs (Time-To-Live), paired with temporary object storage in S3 (or MinIO for local development) configured with a strict 1-hour lifecycle rule.
- **Stateless Quotas & Sessions**: User identity is modeled as an anonymous session stored in a stateless, signed JWT held inside an `httpOnly` secure cookie. Daily quotas and rate limits are tracked directly via atomic Redis counter keys expiring every 24 hours.
- **Privacy by Default**: Files exist solely for the duration required to process and download them. After 1 hour, temporary assets are automatically purged by S3 lifecycle policies and background cleanup routines. No user accounts, billing profiles, or job histories are permanently retained.

---

## 2. Design System & Frontend

ImageLabs follows a sleek, modern, flat design aesthetic prioritizing speed, high contrast, and accessibility.

| Parameter | Specification |
| :--- | :--- |
| **Framework** | React 18 + Vite + TypeScript |
| **Component Library** | shadcn/ui (CLI installed primitives) |
| **Styling** | Tailwind CSS (Strict token extension, no arbitrary styles) |
| **Border Radius** | Full-rounded corners (`rounded-full` / `rounded-2xl`) |
| **Shadows** | **None** (`shadow-none` globally; zero box-shadows or elevation) |
| **Typography** | Manrope (`@fontsource/manrope`), default weight Medium (500) |
| **Dark Mode** | Neutral pure grays (`#0a0a0a`, `#171717`, `#262626`) — zero blue/color tint |
| **Accessibility** | WCAG 2.1 AA compliant, complete keyboard navigation, explicit ARIA labels |

### Key UI Components
- **Upload Zone**: Drag-and-drop container accepting single or batch files with MIME validation, upload progress indicators, and cloud import integration.
- **Tool Grid**: Responsive visual catalog displaying all available ImageLabs tools organized by category with keyboard focus support.
- **Processing View**: Real-time job execution screen displaying status updates, step progress bars, and cancel options via polling or SSE.
- **Result View**: Post-processing download screen providing direct presigned download links, batch zip generation, and quick-action tool chaining.
- **Quota Meter**: Minimal visual progress indicator displaying daily jobs and bandwidth consumption tracked against session limits.

---

## 3. Complete Feature & Tool List

### Optimization

| Tool | Description | Target Functionality |
| :--- | :--- | :--- |
| **ImageLabs Compress** | Intelligent file size reduction | Automatic lossy and lossless image compression without manual quality sliders; optimal balance between visual fidelity and payload size. |
| **ImageLabs Resize** | Batch dimension scaling | Batch resizing by exact pixels or percentage, aspect ratio lock, and smart max-width/max-height constraints for mixed batches. |

### Conversion

| Tool | Description | Target Functionality |
| :--- | :--- | :--- |
| **ImageLabs Convert to JPG** | Convert non-JPG formats to JPEG | High-speed conversion from PNG, GIF, TIF, RAW, WebP, and HEIC formats into standard JPEG images. |
| **ImageLabs Convert from JPG** | Convert JPEG images to other formats | Converts standard JPG inputs into PNG, static GIF, or animated GIF with customizable frame delay and looping settings. |
| **ImageLabs Convert Image** | Universal multi-format conversion | General multi-format converter supporting modern web formats including WebP, AVIF, PNG, TIFF, and JPEG. |

### Basic Editing

| Tool | Description | Target Functionality |
| :--- | :--- | :--- |
| **ImageLabs Crop** | Precision image cropping | Single image freeform cropping or batch cropping matching predefined aspect ratios (1:1, 4:3, 16:9, etc.). |
| **ImageLabs Rotate** | Directional and arbitrary rotation | Standard 90° clockwise/counter-clockwise increments, arbitrary degree angle rotation, batch orientation, and EXIF auto-orient. |
| **ImageLabs Watermark** | Stamp protection & branding | Overlay text or image-based watermarks with fine control over canvas positioning, opacity, scale, and repeating tile layouts. |

### Advanced & AI

| Tool | Description | Target Functionality |
| :--- | :--- | :--- |
| **ImageLabs Image Editor** | In-browser canvas manipulation suite | Full client-side Fabric.js vector and raster canvas editor supporting drawing, filters, shapes, text, and export to PNG/JPG. |
| **ImageLabs Meme Generator** | Meme creation utility | Top and bottom text overlays using the Impact font with high-contrast outlines, multi-line auto-wrapping, and template selection. |
| **ImageLabs HTML to Image** | Render web markup to image | Headless Puppeteer engine capturing pixel-perfect screenshots of raw HTML strings or web URLs within sandboxed workers. |
| **ImageLabs Upscale Image** | AI-driven super-resolution | 2x and 4x neural resolution enhancement using Real-ESRGAN models dispatched via Replicate API. |
| **ImageLabs Remove Background** | Neural subject isolation | Automatic background excision powered by `rembg` (U2-Net) or RMBG-1.4 dispatched to Replicate/HuggingFace runners. |
| **ImageLabs Blur Face** | Privacy anonymization | Face detection and Gaussian blurring using client-side MediaPipe with an OpenCV server fallback for non-supported browsers. |

### Platform Features

| Tool | Description | Target Functionality |
| :--- | :--- | :--- |
| **Batch Processing** | Multi-file execution | Process dozens of images simultaneously within per-session concurrency and quota allowances. |
| **Cloud Import / Export** | Remote asset transfer | Direct integration with Google Drive and Dropbox for importing source files and exporting outputs. |
| **Drag-to-Reorder & Sort** | File sequence management | Client-side visual rearrangement, drag-and-drop sequencing, and alphabetical sorting before batch processing. |
| **Quota Meter** | Transparent consumption tracker | Real-time usage display reporting daily processed jobs and uploaded bytes calculated against signed session keys. |
| **Auto-Delete (1-Hour)** | Automated data disposal | Complete resource wiping combining 1-hour S3 bucket lifecycle rules, Redis TTL expiration, and scheduled cleanup cron jobs. |

---

## 4. Tech Stack Per Feature

| Feature | Library / Tool | Rationale |
| :--- | :--- | :--- |
| **Frontend Core** | React 18, Vite, TypeScript | Fast bundling, reliable ecosystem, strong typing across workspace boundaries. |
| **UI Components** | shadcn/ui, Tailwind CSS | Accessible, unstyled headless primitives styled with custom flat design tokens. |
| **Image Processing (Node)** | Sharp (libvips) | Ultra-fast native image resizing, compression, rotation, and standard format conversion. |
| **Advanced Image Operations** | ImageMagick CLI (Fallback) | Handles complex color profiles, esoteric RAW formats, and specialized image math. |
| **Canvas Editor** | Fabric.js | Battle-tested HTML5 canvas abstraction for client-side annotations and drawing. |
| **Background Removal** | `rembg` (U2-Net) / RMBG-1.4 | High-accuracy neural background isolation via Replicate/HuggingFace APIs. |
| **Upscaling** | Real-ESRGAN | High-fidelity 2x/4x super-resolution restoration for low-res inputs via Replicate. |
| **Face Detection & Blur** | MediaPipe (Client) / OpenCV (Server) | Zero-latency client-side face obfuscation with robust backend fallback. |
| **HTML to Image** | Puppeteer (Headless Chrome) | Sandboxed HTML/CSS/JS rendering engine for high-fidelity raster capture. |
| **Animated GIF** | `gifencoder` + Sharp | Efficient frame assembly, delay synchronization, and palette generation. |
| **Job Queue** | BullMQ | Distributed, Redis-backed job scheduling with retries, stalls, and progress events. |
| **State & Session Store** | Redis (ioredis) | Ultra-low latency ephemeral hash storage, TTL enforcement, and quota meters. |
| **Authentication** | Stateless JWT in `httpOnly` Cookie | Session tracking without server-side user tables or database dependencies. |
| **File Storage** | AWS S3 / MinIO | Temporary asset staging using presigned read/write URLs with 1-hour lifecycle TTL. |
| **Database** | **None (removed by design)** | All state is intentionally ephemeral to guarantee privacy and eliminate DB maintenance. |

---

## 5. Backend, API, and Job/Queue

### Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 Client (Browser)                                  |
|   (React 18 + Vite + Tailwind + shadcn/ui + Fabric.js / MediaPipe Face Blurring)  |
+-----------------------------------------+-----------------------------------------+
                                          |
                1. Presigned Upload Request / 3. Dispatch Job / 5. Poll & Download
                                          v
+-----------------------------------------------------------------------------------+
|                             API Gateway / Reverse Proxy                           |
|                             (Cloudflare / CloudFront)                             |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                              Backend API (Fastify)                                |
|        - Stateless JWT Session Auth         - Input Validation (Zod)              |
|        - S3 Presigned URL Generator         - Quota & Rate Limit Check (Redis)    |
+--------------------+------------------------------------+-------------------------+
                     |                                    |
     Read / Write    |                                    | Enqueue Jobs
    Session & Quotas |                                    |
                     v                                    v
+------------------------------------+   +------------------------------------------+
|         Redis (ioredis)            |   |               BullMQ Queues              |
|  - `session:{id}` (TTL 24h)        |   |  - Queue: `fast-jobs`                    |
|  - `quota:{session}:{day}` (24h)   |   |  - Queue: `ai-jobs`                      |
|  - `job:{uuid}` Hash (TTL 1h)      |   |  - Queue: `puppeteer-jobs`               |
|  - `ratelimit:{ip}:{endpoint}`     |   +--------------------+---------------------+
+------------------------------------+                        |
                                                              |
                  +-------------------------------------------+
                  |                   |                       |
                  v                   v                       v
      +-----------------------+ +--------------------+ +----------------------------+
      |      Fast Worker      | |     AI Worker      | |      Puppeteer Worker      |
      |     (Node + Sharp)    | | (Replicate / rembg)| |    (Headless Rendering)    |
      +-----------+-----------+ +---------+----------+ +--------------+-------------+
                  |                       |                           |
                  +-----------------------+---------------------------+
                                          |
                       Fetch Inputs / Put Result Artifacts
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        Temporary Object Storage (S3 / MinIO)                      |
|             Bucket: `imagelabs-temp` (Strict 1-Hour Lifecycle Rule)              |
+-----------------------------------------------------------------------------------+
```

### REST Endpoint Specification

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/session` | Issues or refreshes an anonymous stateless session JWT stored in an `httpOnly` cookie. |
| `POST` | `/api/upload` | Validates file metadata and issues presigned S3 PUT URLs for direct client uploads. |
| `POST` | `/api/jobs` | Enqueues a new image processing job into BullMQ after quota validation. |
| `GET` | `/api/jobs/:id` | Returns the current processing state, progress percentage, or error detail of a job. |
| `GET` | `/api/jobs/:id/download` | Returns presigned S3 GET URLs for the completed output files. |
| `DELETE` | `/api/jobs/:id` | Aborts a queued/running job and triggers immediate deletion of input/output keys in S3. |
| `GET` | `/api/quota` | Retrieves current quota consumption (jobs executed, bandwidth used) for the active session. |

### Error Codes

- `400 INVALID_INPUT`: Malformed payload, failed Zod validation, or illegal parameters.
- `401 NO_SESSION`: Missing, invalid, or expired session JWT in cookie.
- `403 QUOTA_EXCEEDED`: Session daily job count or bandwidth allowance reached.
- `404 JOB_NOT_FOUND`: Job ID not found or already expired from Redis.
- `413 FILE_TOO_LARGE`: Uploaded file exceeds single-file size ceiling.
- `415 UNSUPPORTED_TYPE`: MIME type not recognized or forbidden for the requested tool.
- `429 RATE_LIMITED`: Request velocity threshold exceeded for IP/Session.
- `500 INTERNAL`: Unhandled system exception or worker execution failure.

### Job Lifecycle
Every image processing task is tracked in Redis via a hash under the key `job:{uuid}` with a hard TTL of 3600 seconds (1 hour).

1. **Creation**: The API validates the session and quota, generates a UUID, stores the initial hash (`status: queued`, `progress: 0`, `session`, `inputs`, `tool`), sets TTL to 3600s, and pushes a task into the appropriate BullMQ queue (`fast`, `ai`, or `puppeteer`).
2. **Processing**: A worker claims the task, updates the hash (`status: processing`), downloads input objects from S3, executes transformations, and periodically reports progress (0–100%).
3. **Completion / Failure**: 
   - On success: Output files are uploaded to S3 under `outputs/{uuid}/*`, and the hash is updated (`status: completed`, `progress: 100`, `outputs: [...]`).
   - On error: The hash is updated (`status: failed`, `error: { code, message }`).
4. **Expiry**: After 1 hour, Redis evicts the hash. S3 lifecycle policies simultaneously purge the corresponding input and output object keys.

### Quota Model

| Counter Key Pattern | TTL | Default Limit | Purpose |
| :--- | :--- | :--- | :--- |
| `quota:jobs:{session}:{YYYY-MM-DD}` | 86400s (24h) | 20 jobs / day | Limits total daily job dispatches per session |
| `quota:bytes:{session}:{YYYY-MM-DD}` | 86400s (24h) | 500 MB / day | Limits cumulative upload bandwidth per session |
| `ratelimit:{ip}:{endpoint}` | 60s (1m) | 30 req / min | Prevents brute-force or denial of service attacks |

---

## 6. Security & Privacy

| Domain | Policy & Implementation |
| :--- | :--- |
| **Transport** | Strict TLS 1.3 encryption on all public endpoints. HSTS enabled with long max-age. |
| **Session** | Stateless HMAC-SHA256 signed JWT inside an `httpOnly`, `Secure`, `SameSite=Lax` cookie. |
| **File Isolation** | S3 object paths partitioned by job UUID: `inputs/{uuid}/*` and `outputs/{uuid}/*`. Presigned URLs scope access to target objects only. |
| **Auto-Deletion** | S3 bucket lifecycle rule automatically expires and deletes objects after 1 hour. Redis keys expire via 1h TTL. |
| **Encryption at Rest** | S3 server-side encryption (SSE-S3 or SSE-KMS) enabled by default for all stored objects. |
| **Input Validation** | Strict Zod validation on every endpoint. Magic number inspection on binary streams to prevent MIME spoofing. |
| **Rate Limiting** | Sliding window rate limiting in Redis on all sensitive API routes. |
| **CSRF** | Custom API header verification (`X-Requested-With` / custom header) combined with `SameSite` cookies. |
| **AI Data** | Transient API calls only. Zero data retention agreements configured with third-party AI inference providers. |
| **GDPR** | Compliant by design. No PII stored, no relational records, no user profiling, immediate data decay. |

### Privacy Highlights
ImageLabs is designed around data minimization. All uploaded images, processed outputs, and metadata are strictly transient. No human reviews user files, no machine learning models are trained on user assets, and no user accounts exist. Sessions contain no personally identifiable information (PII) and can be permanently cleared at any time simply by deleting the session cookie or allowing the 1-hour lifecycle window to elapse.

---

## 7. Performance Targets

| Metric | Target | Measurement Condition |
| :--- | :--- | :--- |
| **Time to Interactive (TTI)** | < 2.0s | Mobile 4G / Standard Desktop connection |
| **Upload Latency** | < 500ms | 10 MB payload via direct S3 presigned upload |
| **Fast Tool Processing** | < 1.0s / image | Sharp native worker (Compress, Resize, Convert, Crop) |
| **AI Tool Processing** | < 5.0s / image | Replicate / AI Worker cold start excluded |
| **Concurrency** | 100+ Fast / 20 AI | Concurrent jobs processed without queue degradation |
| **System Uptime** | 99.9% | Availability of public API and Web application |

---

## 8. Deployment & Infrastructure

- **Compute**: Containerized microservices running on AWS ECS Fargate (or EKS for Kubernetes environments), autoscaling based on BullMQ queue depth and CPU utilization.
- **Temporary Storage**: AWS S3 bucket (`imagelabs-temp`) with a lifecycle policy executing complete deletion after 1 day (with a 1-hour cron for precise cleanup).
- **In-Memory Cache & Queues**: AWS ElastiCache for Redis (Cluster mode enabled or primary-replica setup) managing BullMQ queues and ephemeral state. **No RDS or relational DB instances deployed.**
- **Edge CDN & DDoS Protection**: CloudFront paired with Cloudflare for SSL termination, asset caching, and perimeter DDoS mitigation.
- **AI Inference Runtime**: Serverless Replicate API endpoints executing containerized Real-ESRGAN and RMBG models.
- **Secrets Management**: AWS Secrets Manager / Parameter Store injecting environment credentials at container runtime.
- **CI/CD Pipeline**: GitHub Actions running automated linting, typechecking, Vitest suites, building multi-architecture Docker images, pushing to Amazon ECR, and updating ECS/Terraform resources.

---

## 9. What Is Not Discussed

The following topics are intentionally out of scope for this architecture blueprint:
- Native mobile applications (iOS / Android) or desktop wrappers (Electron / Tauri).
- Browser extensions or desktop context-menu integrations.
- Persistent user accounts, authentication databases, saved job histories, or file libraries.
- Billing systems, payment gateways, credit cards, or subscription tiers.
- Enterprise SSO, SAML, or SCIM integrations.
- Custom machine learning model training, fine-tuning, or proprietary model hosting.
- Legal copyright arbitration, digital rights management (DRM), or DMCA takedown pipelines.
- Commercial pricing structures or third-party affiliate partnerships.

Suggested File Name: ImageLabs_Architecture_Blueprint_v2_NoDB.md
