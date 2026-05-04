# Article Digest -- Proof Points

Compact proof points from extended experience that do not always fit cleanly in the public CV. Read by career-ops at evaluation time.

---

## Riverside -- Group Leadership, Org Design, and Leader Development

**Tags:** leadership, manager-of-managers, org-design, team-leads, engineering-managers, coaching, hiring, platform, qa

**Hero scope:** Ran a multi-team group at Riverside through other leaders, not as a flat 27-direct-report structure.

**Operating model:** Group leadership across 3 feature teams (Publishing, Business, Growth) plus 1 platform team, with an additional QA Engineering Manager spanning QA/automation coverage across those teams. Day-to-day leverage came through team leads and engineering managers rather than direct 1:1 management with every individual contributor.

**Key decisions:**
- Helped evolve the org from a flatter structure into clearer team ownership and leadership layers.
- Elevated strong ICs into Team Lead roles and coached emerging engineering managers as the organization scaled.
- Stayed accountable for group direction, architecture, hiring quality, and org design while delegating local execution through leaders.

**Proof points:**
- Managed a 27-person group across 3 feature teams and 1 platform team, plus QA leadership spanning those teams, without operating as a flat direct-manager for all 27 people.
- Built leadership leverage by growing team leads and coaching engineering managers rather than centralizing all execution.
- Combined org design, hiring, architectural review, and platform strategy in one group-level leadership role.

---

## Riverside -- Authentication State Migration

**Tags:** auth, authentication, authorization, identity, jwt, sessions, redis, api-gateway, zero-downtime, migration

**Hero scope:** Zero-downtime migration of millions of active sessions from a legacy monolith to a JWT-based service architecture while users were live in audio/video recording flows.

**Architecture:** Legacy Express + passport.js + MongoDB sessions -> API Gateway -> JWT service + Redis-backed session state

**Key decisions:**
- Ran a phased parallel migration with dual-issued JWTs and legacy cookies.
- Moved token validation to the API Gateway before cutting traffic over.
- Let legacy sessions drain naturally over the 14-day expiration window instead of forcing a hard cutover.

**Proof points:**
- Migrated millions of active sessions with zero downtime.
- Protected live recording flows where dropped sessions were unacceptable.
- Mentored a less-senior engineer into rollout ownership instead of centralizing the critical path.

---

## Riverside -- Monolith Evolution, Reliability, and Observability

**Tags:** platform, backend, reliability, observability, tracing, datadog, rum, kafka, correlation-ids, monolith, performance, scalability

**Hero scope:** Stabilized cascading OOM failures during 15x growth while guiding decomposition of a Node.js monolith into more isolated services.

**Architecture:** Domain service extraction + isolated Kafka consumers + Datadog-backed cross-service tracing + frontend RUM + correlation IDs across HTTP and Kafka boundaries

**Key decisions:**
- Strangled the monolith into domain-specific services rather than only scaling hardware.
- Separated heavy asynchronous consumers to isolate workload pressure.
- Added tracing rules to identify oversized payloads and abnormal trace volume endpoint by endpoint.
- Used Datadog as the main observability surface across Node.js services, and added frontend RUM where user-facing visibility mattered.
- Propagated trace and correlation identifiers through headers and Kafka messages so requests could be followed across service boundaries.

**Proof points:**
- Found the real bottleneck in Editor payload hydration through Mongoose.
- Stopped cascading crashes and turned the tracing system into a lasting performance standard.
- Added end-to-end observability across backend services, Kafka flows, and frontend surfaces rather than relying on isolated logs.
- This broader work later contributed to a 33% reduction in overall latency.

---

## Riverside -- Payments, Billing, and Token Ledger

**Tags:** payments, billing, ledger, monetization, entitlements, stripe, fintech, token-ledger, product-platform

**Hero scope:** Owned billing and payment-product logic from an early Stripe plus webhooks setup through a more mature platform model for plans, features, entitlements, and AI consumption.

**Architecture:** Stripe execution layer + internal plans/features/entitlements model + event-driven token ledger for AI consumption

**Key decisions:**
- Kept Stripe as the payment execution layer while moving product logic for plans, features, and entitlements into Riverside systems.
- Designed the AI token ledger as an event-driven foundation but scoped v1 to essential purchase and spending events.
- Deferred user-facing transaction history and automated refunds until usage patterns justified them.

**Proof points:**
- Built a more robust monetization foundation without overbuilding payments primitives.
- Enabled faster iteration on billing behavior and AI feature consumption.
- Created a path for later refund and credit flows without re-architecting the core model.

---

## Riverside -- Cross-Team AI Dubbing Orchestration

**Tags:** ai, orchestration, event-driven, kafka, cross-team, platform, async-contracts, integrations

**Hero scope:** Defined the orchestration layer for a multi-team AI dubbing workflow spanning Editor, AI, and Platform under deadline pressure.

**Architecture:** Legacy webhooks -> feature-flagged switch -> Kafka events, with explicit asynchronous contracts across text, audio, video, and subtitles

**Key decisions:**
- Stepped in to define boundaries and contracts when team ownership was unclear.
- Chose webhook-first integration with a clean migration path to Kafka once the upstream service was ready.
- Delegated implementation of the contracts while coordinating delivery across three teams.

**Proof points:**
- Shipped the orchestration layer on time for a deadline-critical feature.
- Helped the AI team complete its first successful event-driven integration.
- Earned recognition from Riverside's VP of Engineering for bridging siloed teams.

---

## Riverside -- Workflow Orchestration and Temporal Exposure

**Tags:** workflow orchestration, temporal, async workflows, workers, retries, idempotency, platform

**Hero scope:** Worked with Temporal-backed workflows at Riverside closely enough to understand workflow design, worker architecture, and how long-running async flows were operated in production, even though the platform itself was owned by another team.

**Architecture:** Application services triggering Temporal workflows -> worker processes managed by DevOps/platform -> async task execution with retries and persisted workflow state

**Key decisions:**
- Worked within workflow-based orchestration for multi-step async product flows where retries, durability, and execution ordering mattered.
- Collaborated in a setup where DevOps handled worker operations and infrastructure, giving practical exposure without overstating direct platform ownership.
- Built a working understanding of workflow boundaries, retries, idempotency, and failure handling from the product and engineering side.

**Proof points:**
- Hands-on exposure to Temporal workflows in production at Riverside.
- Understands the core concepts and architecture well enough to discuss workflow trade-offs credibly in interviews.
- Can frame this as adjacent real-world experience rather than deep workflow-platform ownership.

---

## Riverside -- Developer Platform, CI/CD, and Service Templates

**Tags:** developer-experience, devex, platform, ci-cd, github-actions, microservices, kafka, logging, templates, docker, release-engineering

**Hero scope:** Improved the internal developer platform at Riverside by standardizing how microservices were created, instrumented, and released.

**Architecture:** Microservice templates + shared internal libraries for Kafka and logging + GitHub Actions release pipelines + Docker-based service packaging

**Key decisions:**
- Proposed creating Riverside's first dedicated platform team as the company grew and the need for internal infrastructure became unavoidable.
- Partnered with the incoming VP of Engineering to reshape an existing team, move user-facing ownership to more relevant product teams, and free the new platform team to focus on leverage for the broader organization.
- Created reusable service templates so new microservices started from a consistent baseline instead of custom one-off setups.
- Built shared company libraries for Kafka consumption and logging so teams could adopt the same operational patterns across services.
- Simplified release engineering from a more complicated branching model to a thinner single-branch flow: work via PRs into `main`, create a version tag or release, and let GitHub Actions deploy the latest release automatically.
- Kept Docker packaging deliberately simple so teams could ship reliably without accumulating unnecessary CI/CD complexity.
- Started measuring operational health through release frequency, alert responsiveness, and defect trends as the platform model replaced older multi-environment release habits.

**Proof points:**
- Helped define the organizational case for platform as a product, not just a support function.
- Built the first formal platform team around internal infrastructure, developer workflows, and shared engineering leverage.
- Improved developer experience by making service setup faster and more standardized across teams.
- Reduced friction in microservice delivery through a simpler GitHub Actions-based release model.
- Helped turn platform work into leverage for the broader engineering organization rather than only supporting a single team.
- Partnered directly with the platform team lead, release manager, and VP of Engineering to push the release-process redesign first through microservices and then into the monolith.

---

## Riverside -- AI Adoption in Engineering Workflow

**Tags:** ai, developer-experience, code-review, copilots, cursor, agentic-workflows, engineering-productivity, platform

**Hero scope:** Pushed Riverside's early adoption of AI-assisted engineering in a pragmatic way, starting with coding and review workflows rather than hype-driven experiments.

**Key decisions:**
- Championed the first serious use of GitHub Copilot and later Cursor across engineering teams.
- Introduced AI-assisted PR review to reduce review bottlenecks and surface issues earlier, before human review became the constraint.
- Treated AI as an engineering systems problem: useful when paired with clear workflows, guardrails, and internal tooling rather than as an open-ended chat interface.
- Left Riverside before the next wave of agentic automation matured, but had already been pushing the organization toward stronger internal tooling and CLI-driven workflows that AI systems could build on top of.

**Proof points:**
- Was an early internal advocate for practical AI adoption in day-to-day engineering work.
- Helped normalize AI-assisted code generation and review as part of the workflow rather than as an individual experiment.
- Formed a clear point of view that the strongest long-term path is AI layered on top of high-quality company tooling, templates, and workflows.

---

## Sabbatical -- AI-Native Product Builds

**Tags:** ai, llm, agentic, projects, product, local-first, grounded-search, browser-automation, hands-on

**Hero scope:** Built and shipped three products to develop a practical AI-native engineering workflow end to end.

**Products:** Verba (local-first transcription), Informia (document extraction and browser-assisted submission), FallosES (grounded legal research assistant)

**Key decisions:**
- Standardized a workflow around voice-prompted context capture, two-phase planning, TDD, and manual review.
- Focused Verba on on-device transcription and privacy-by-default instead of cloud dependency and mandatory registration.
- Used grounded retrieval, citations, and context caching where the product demanded traceable AI behavior.

**Proof points:**
- Kept hands-on product building current during the sabbatical rather than treating AI as a purely managerial topic.
- Shipped production-style products across local AI, browser automation, and grounded search use cases.
- These projects are also reflected in `resumes/ic-base.json`.

---

## Riverside -- Foundational LLM Microservice & First AI Features

**Tags:** ai, llm, gpt-3, microservices, architecture, prompt-engineering, cross-team, product-engineering

**Hero scope:** Led the team that built Riverside's first LLM features (Show Notes, Magic Clips) and architected the foundational AI microservice used by the rest of the company.

**Architecture:** GPT-3 -> Node.js microservice -> Context window management (splitting/summarizing) -> Quota management & common handlers -> Fine-tuned internal model (later phase)

**Key decisions:**
- Built the first AI-driven features (Show Notes, Magic Clips) by overcoming early GPT-3 context limitations through chunking and summarization pipelines.
- Extracted the AI orchestration into a dedicated microservice to centralize quota management, context handling, and transcription processing for the whole company.
- Collaborated directly with Product to iterate on prompts and output quality.
- Captured usage data (downloads, exports, upvotes) to eventually allow the internal AI team to train a fine-tuned model for Magic Clips.

**Proof points:**
- Shipped Riverside's first flagship AI features: Show Notes (automated chapters, summaries, keywords) and Magic Clips (automated viral highlights).
- Created the foundational LLM microservice that enabled multiple other teams to build AI features (blog posts, translations, video dubbing).
- Transitioned a prompt-engineered GPT-3 MVP into a data-flywheel that powered a custom fine-tuned model.
