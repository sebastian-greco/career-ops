# Article Digest -- Proof Points

Compact proof points from extended experience that do not always fit cleanly in the public CV. Read by career-ops at evaluation time.

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

**Tags:** platform, backend, reliability, observability, tracing, kafka, monolith, performance, scalability

**Hero scope:** Stabilized cascading OOM failures during 15x growth while guiding decomposition of a Node.js monolith into more isolated services.

**Architecture:** Domain service extraction + isolated Kafka consumers + cross-service tracing + payload and trace guardrails

**Key decisions:**
- Strangled the monolith into domain-specific services rather than only scaling hardware.
- Separated heavy asynchronous consumers to isolate workload pressure.
- Added tracing rules to identify oversized payloads and abnormal trace volume endpoint by endpoint.

**Proof points:**
- Found the real bottleneck in Editor payload hydration through Mongoose.
- Stopped cascading crashes and turned the tracing system into a lasting performance standard.
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
