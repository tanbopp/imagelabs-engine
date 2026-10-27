# Phase 15: Production Containerization, CI/CD & Cloud Deployment

## 1. Phase Title & Goal
- **Phase Title**: Phase 15 — Production Containerization, CI/CD & Cloud Deployment.
- **Goal**: Package ImageLabs for production deployment using multi-stage Dockerfiles for all applications and workers, automated GitHub Actions pipelines (Continuous Integration and Continuous Deployment to Amazon ECR/ECS), and Infrastructure-as-Code (Terraform) provisioning AWS resources (ECS Fargate, S3 temp bucket with 1-hour lifecycle, ElastiCache Redis, and CloudFront CDN). Explicitly enforce zero database resources.

---

## 2. Context & Dependencies
- **Dependencies**: Depends on all previous phases (Phases 00 through 14).
- **Core Principle**: Turnkey deployment with complete automation, reproducible builds, and strict ephemeral state architecture.

---

## 3. Scope

### In-Scope
- Production Dockerfiles:
  - `apps/web/Dockerfile`: Multi-stage build with Nginx Alpine serving optimized static assets.
  - `apps/api/Dockerfile`: Node.js 20 Alpine production image with trimmed node_modules.
  - `workers/fast/Dockerfile`: Node.js 20 Alpine with native Sharp/libvips build.
  - `workers/ai/Dockerfile`: Python 3.10 + PyTorch CPU/CUDA + Node runtime for AI tools.
  - `workers/puppeteer/Dockerfile`: Node.js with Chromium headless binaries and sandbox dependencies.
- GitHub Actions CI/CD Workflows:
  - `.github/workflows/ci.yml`: Automated linting, typechecking, Vitest suites, and Docker build verification on pull requests.
  - `.github/workflows/deploy.yml`: Pushes container images to Amazon ECR and updates ECS service task definitions upon merge to `main`.
- Terraform AWS Infrastructure as Code (`infra/terraform`):
  - AWS ECS Fargate cluster with autoscaling task services.
  - Amazon ElastiCache for Redis (in-memory queues and ephemeral state).
  - AWS S3 bucket (`imagelabs-temp`) with a strict 1-hour lifecycle expiration rule.
  - CloudFront CDN distribution with SSL certificate integration.
  - **Explicit architectural rule: Zero RDS, Aurora, or DynamoDB resources.**
- Production Environment Configuration template and secrets rotation guidelines.

### Out-of-Scope
- Hybrid cloud / multi-cloud Kubernetes failover.
- Self-hosted bare metal data center configurations.

---

## 4. Tech Stack & Libraries
- **Containerization**: Docker (BuildKit), Docker Compose.
- **CI/CD**: GitHub Actions.
- **Cloud Provider**: Amazon Web Services (AWS).
- **IaC**: Terraform v1.8+.
- **AWS Services**: ECS Fargate, ECR, ElastiCache (Redis), S3, CloudFront, Route53, Secrets Manager.

---

## 5. Files to Create / Modify
- `apps/web/Dockerfile`: Static web server container.
- `apps/api/Dockerfile`: Fastify API server container.
- `workers/fast/Dockerfile`: Sharp worker container.
- `workers/ai/Dockerfile`: AI worker container with Python dependencies.
- `workers/puppeteer/Dockerfile`: Puppeteer Chromium container.
- `.github/workflows/ci.yml`: Continuous integration workflow.
- `.github/workflows/deploy.yml`: Continuous delivery workflow.
- `infra/terraform/main.tf`: Root AWS infrastructure definitions.
- `infra/terraform/ecs.tf`: ECS cluster, tasks, and autoscaling policies.
- `infra/terraform/redis.tf`: ElastiCache Redis cluster.
- `infra/terraform/s3.tf`: S3 temporary bucket with 1-hour lifecycle rule.
- `infra/terraform/cloudfront.tf`: CDN distribution and routing.
- `infra/terraform/variables.tf`: Configuration variables.

---

## 6. Detailed Requirements

### 6.1 Multi-Stage Dockerfile Patterns
- All Dockerfiles leverage multi-stage caching using `pnpm fetch` and Turborepo prune:
  1. **Builder Stage**: Installs all dependencies, compiles TypeScript packages (`@imagelabs/shared`), and creates production bundles.
  2. **Runner Stage**: Minimal non-root base image (`USER node` or dedicated unprivileged user), copying only production artifacts and necessary runtime files.

### 6.2 GitHub Actions Workflows
- **`ci.yml`**:
  - Triggers on: `pull_request` to `main`.
  - Steps: Checkout $\rightarrow$ Setup pnpm $\rightarrow$ Setup Node $\rightarrow$ Install deps $\rightarrow$ `pnpm lint` $\rightarrow$ `pnpm typecheck` $\rightarrow$ `pnpm test` $\rightarrow$ Test Docker build.
- **`deploy.yml`**:
  - Triggers on: `push` to `main`.
  - Steps: Authenticate to AWS via OIDC $\rightarrow$ Login to Amazon ECR $\rightarrow$ Build and push Docker tags $\rightarrow$ Deploy new task definitions to ECS Fargate services (`web`, `api`, `fast-worker`, `ai-worker`, `puppeteer-worker`).

### 6.3 Terraform Ephemeral Infrastructure
- **S3 Bucket Lifecycle Rule**:
  ```hcl
  resource "aws_s3_bucket_lifecycle_configuration" "temp_lifecycle" {
    bucket = aws_s3_bucket.imagelabs_temp.id

    rule {
      id     = "auto-delete-after-1-hour"
      status = "Enabled"

      expiration {
        days = 1 # AWS S3 minimum lifecycle expiration interval
      }
    }
  }
  ```
  *(Note: Precise 1-hour deletion is supplemented by the scheduled cleanup script from Phase 13).*
- **ElastiCache Redis**: Single node or multi-AZ replication group with Redis 7.x engine, zero persistent disk snapshotting.
- **ECS Fargate**: Auto-scaling policies scaling worker tasks based on BullMQ queue depth metrics exported to CloudWatch.

---

## 7. UI Specification
- N/A for Phase 15 (DevOps, Infrastructure, and CI/CD).

---

## 8. API / Data Contract
- N/A for Phase 15.

---

## 9. Security & Compliance
- **Non-Root Containers**: Every production container must run as a non-privileged user (`USER node` or `USER nonroot`).
- **Secrets Management**: No secret credentials stored in code or Docker images. AWS Secrets Manager injects `JWT_SECRET`, `REPLICATE_API_TOKEN`, and API keys directly into container environment variables at runtime.
- **IAM Principle of Least Privilege**: Workers have read/write access scoped exclusively to the `imagelabs-temp` S3 bucket.

---

## 10. Performance
- CI pipeline total execution time: $< 4\text{ minutes}$ using Turborepo and Docker layer caching.
- Zero downtime deployments utilizing ECS rolling blue/green deployments.

---

## 11. Step-by-Step Implementation Order
1. Author optimized multi-stage Dockerfiles for `web`, `api`, and all three worker tiers.
2. Build local test images to verify entrypoint scripts and runtime permissions.
3. Configure GitHub Actions `ci.yml` workflow and validate on branch.
4. Write Terraform modules for S3, ElastiCache Redis, ECS Fargate, and CloudFront.
5. Setup GitHub Actions `deploy.yml` with AWS OIDC authentication.
6. Run staging deployment and execute smoke tests against live cloud endpoints.

---

## 12. Acceptance Criteria
- [ ] All Docker images build successfully with minimal footprint (e.g., API $< 150\text{ MB}$, Web $< 40\text{ MB}$).
- [ ] GitHub Actions CI runs on pull requests and blocks merging on lint/test failures.
- [ ] Terraform plan contains **zero** database instances (RDS, Aurora, DynamoDB).
- [ ] CloudFront successfully routes traffic: `/api/*` to Fastify ECS service and root `/*` to Web service.
- [ ] S3 bucket has verified lifecycle rules and non-public access policies.

---

## 13. Test Scenarios
- Test: Run `docker build` across all 5 Dockerfiles $\rightarrow$ verify builds succeed and run without permission errors.
- Test: Trigger GitHub Actions CI with intentional test failure $\rightarrow$ verify workflow fails and blocks merge.
- Test: Execute Terraform validate $\rightarrow$ verify syntax and resource definitions are valid.

---

## 14. Definition of Done
- Full automated CI/CD pipeline operational.
- Infrastructure-as-Code ready for production AWS provisioning.
- Strict adherence to no-database ephemeral architecture maintained end-to-end.
