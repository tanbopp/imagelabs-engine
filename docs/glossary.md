# ImageLabs Architecture Glossary

### Job
A single image processing request consisting of one tool identifier, execution options, and one or more input files staged in object storage. Each job is tracked as a Redis hash under the key pattern `job:{uuid}` with a strict 3600-second (1-hour) TTL, coordinating status transitions across BullMQ queues and worker consumers.

### Session
An anonymous, ephemeral client identity encapsulated in a stateless, cryptographically signed JSON Web Token (JWT) stored in a secure `httpOnly` cookie. ImageLabs maintains no persistent server-side user table or registration profile; sessions serve solely to attribute daily usage counters and enforce rate limits.

### Tool
One of the 14 discrete image processing capabilities supported by ImageLabs (such as Compress, Resize, Crop, or Remove Background). Each tool defines its metadata, accepted batch capabilities, compute requirements (Fast Sharp worker vs. AI inference), and Zod validation parameters in `@imagelabs/shared`.

### Worker
A background worker process consuming asynchronous processing tasks from designated BullMQ queues and publishing output assets back to S3. The ImageLabs cluster deploys three dedicated worker tiers: the Sharp-powered `fast` worker, the neural `ai` worker, and the headless `puppeteer` worker.

### Quota
A per-session daily consumption limit controlling the number of jobs dispatched and cumulative bytes uploaded. Quotas are recorded using atomic Redis counter keys with a rolling 24-hour expiration window, ensuring fair platform usage without needing a relational billing or account database.

### Presigned URL
A cryptographically signed, time-limited Amazon S3 URL granting direct read or write access to a specific object key without exposing root storage credentials. Clients upload source assets and retrieve processed deliverables directly from S3 using these temporary endpoints.

### Ephemeral State
An architectural constraint specifying that all application state, metadata, and files must have a definitive, automated expiration threshold. ImageLabs enforces ephemeral state via 1-hour Redis hash TTLs, 24-hour quota expirations, and a 1-hour lifecycle rule on temporary S3 storage buckets.

### Phase
A self-contained milestone within the ImageLabs delivery roadmap governed by a dedicated Product Requirements Document (PRD) located under `docs/prd/`. Each phase delivers an independently testable, functional layer of the system according to the project conventions and architecture blueprint.
