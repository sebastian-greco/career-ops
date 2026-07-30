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
- After candid feedback from Riverside's CEO that he was spreading himself too thin, changed his operating model from being the person who jumped into every gap to building leaders and teams that could count on him without depending on him.

**Proof points:**
- Managed a 27-person group across 3 feature teams and 1 platform team, plus QA leadership spanning those teams, without operating as a flat direct-manager for all 27 people.
- Built leadership leverage by growing team leads and coaching engineering managers rather than centralizing all execution.
- Combined org design, hiring, architectural review, and platform strategy in one group-level leadership role.
- Reframed management success around teams remaining healthy and effective without his constant intervention, reducing key-person dependency rather than making himself the center of delivery.

---

## Riverside -- Performance Recovery Through Structured Coaching

**Tags:** people-management, coaching, performance, feedback, senior-engineers, delegation, platform, retention

**Hero scope:** Took on a demoralized senior engineer whom the VP of Engineering was considering dismissing, then helped him recover to an above-average performance outcome without lowering delivery expectations.

**Key decisions:**
- Started with direct acknowledgment of the engineer's strengths and the existing feedback: exceptional problem solving and willingness to help, but weak focus, time management, delivery predictability, and communication when work slipped.
- Put him on a deep technical problem that used his strongest skills while also assigning bounded SLA work, bug fixes, and cross-team dependencies with explicit delivery commitments.
- Made early communication the central behavior change: ask for help, surface a delay, or narrow the investigation before the rest of the team became blocked.
- Treated improvement as a sustained coaching process rather than a single difficult conversation, while keeping the expectations measurable and visible.

**Proof points:**
- The engineer began asking for help openly and communicating risks earlier instead of disappearing into problems.
- Roughly eight months later, Sebastian gave him an above-average performance review that was also approved by the VP who had originally been considering dismissal.
- The team retained a highly capable senior engineer while reducing the dependency and delivery risks that had made his performance unsustainable.

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

**Hero scope:** Owned Riverside's customer-facing billing and plan-management surface from an early Stripe-plus-webhooks setup through a more mature platform model for plans, features, entitlements, account overrides, and plan versioning, then later led cross-team design review for the AI token ledger as Group Lead.

**Architecture:** Stripe execution layer + internal plans/features/entitlements model + account-level overrides + plan versioning and grandfathering support + RevenueCat bridge for mobile + event-driven token ledger for AI consumption

**Key decisions:**
- Kept Stripe as the payment execution layer while moving product logic for plans, features, and entitlements into Riverside systems.
- Cleaned up an early messy billing implementation, including Stripe-side structure, database state, and migrations across legacy plans created before the system had stronger product boundaries.
- During the Engineering Manager phase, owned the backend systems for billing, plans, features, entitlements, and payment flows, and later helped the mobile team integrate RevenueCat with those systems.
- Used the introduction of a new pricing plan as the moment to redesign the feature-management model so features were explicitly mapped to plans instead of being hardcoded across the codebase.
- Designed support for enterprise-specific account overrides so commercial teams could grant temporary or contract-specific features without creating one-off technical debt.
- Added plan versioning so Riverside could grandfather pricing and feature access cleanly across multiple generations of the same plan.
- Reworked churn and account-state handling so support and internal teams could recover and manage problematic account states more cleanly instead of leaving users stuck in inconsistent plan situations.
- As Group Lead, led design review and coordination across two teams in the group to ship the AI token ledger rather than treating it as a single-team EM project.
- Designed the plan and entitlement system in a way that later integrated cleanly with AI token consumption, including free credits in some plans and smoother connection to the token ledger service.
- Designed the AI token ledger as an event-driven foundation but scoped v1 to essential purchase and spending events.
- Deferred user-facing transaction history and automated refunds until usage patterns justified them.

**Proof points:**
- Built a more robust monetization foundation without overbuilding payments primitives.
- Replaced hardcoded feature access with a structured plan, entitlement, and override system that made experimentation, enterprise sales flexibility, and internal testing much easier.
- Improved the customer-facing billing and plan experience by making plan behavior clearer, more flexible, and easier to evolve without regressions.
- Improved commercial flexibility by making it easier to support upsells, close larger enterprise contracts, and temporarily grant account-level feature access where needed.
- Reduced churn and support friction by giving internal teams cleaner tools and account states to work with.
- Improved Stripe-side reporting and internal visibility into plans, revenue behavior, and account distribution.
- Gave account executives and commercial teams a cleaner way to support upsells and enterprise contracts through controlled account-level feature overrides.
- Created a foundation that supported later pricing, packaging, and AI-credit changes without forcing repeated re-architecture.
- Helped connect mobile RevenueCat adoption to Riverside's backend monetization model.
- Led design review and coordination across two teams to ship the token ledger for AI feature consumption.
- Enabled faster iteration on billing behavior and AI feature consumption.
- Created a path for later refund and credit flows without re-architecting the core model.

---

## Riverside -- Early Full-Stack Product Engineering and Customer Feedback Loops

**Tags:** product-engineering, full-stack, early-stage, studio, exports, clips, dashboard, accounts, support, b2b, sso

**Hero scope:** Joined Riverside as one of the earliest engineers in a high-agency setup where engineering worked directly with the CEO and CTO before product management was formalized.

**Operating model:** Fast iteration, broad product surface area, direct exposure to support tickets and user pain, and occasional direct work with B2B customers on product needs.

**Key decisions:**
- Helped shape what to build and how to build it instead of only implementing pre-defined tickets.
- Worked across a wide product surface, including Studio features, early exporting and clip-generation flows, dashboard/account work, and enterprise-facing capabilities.
- Stayed close to support tickets so product and engineering decisions were grounded in real user struggles rather than second-hand summaries.
- Worked directly on some B2B customer needs, including SSO-related work, which strengthened the connection between product trade-offs and commercial reality.

**Proof points:**
- Shipped across multiple user-facing product areas in Riverside's early phase rather than staying inside a narrow backend lane.
- Combined product judgment, customer context, and hands-on implementation in the same role.
- Used direct feedback loops from users, support, and internal stakeholders to iterate quickly and improve the product.
- Strong evidence for high-agency product-engineering roles that want broad ownership, fast learning, and end-to-end thinking.

---

## Riverside -- Protecting Customer Workflows During a Product Information-Architecture Migration

**Tags:** product-leadership, customer-empathy, information-architecture, search, migration, prioritization, analytics, cross-functional

**Hero scope:** Helped protect users during a major change from studio-bound recordings to account-wide projects by surfacing the discovery risk early and reprioritizing global search as a companion capability.

**Key decisions:**
- Challenged the planned experience after recognizing that heavy users with hundreds or thousands of recordings could lose the familiar locations of their content when Riverside introduced projects above studios.
- Accepted that the core migration was too far advanced to reverse, then worked with Product and Design on targeted UX changes instead of turning the disagreement into a late veto.
- Reprioritized account-wide global search so users had a reliable recovery path when the new hierarchy made existing content harder to find.
- Evaluated the rollout through project creation and renaming, acceptance of automatic grouping, search usage, complaints, and the core recording/creation metrics that should not decline because of the change.

**Proof points:**
- The migration did not produce a significant decline in Riverside's core product-usage trends.
- Heavy users actively adopted the project model, while many other users accepted the automatic grouping without needing to reorganize it.
- Global search was well received and addressed a concrete customer risk identified by Engineering rather than only fulfilling a pre-written roadmap item.

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

**Tags:** developer-experience, devex, platform, ci-cd, github-actions, microservices, kafka, logging, templates, docker, release-engineering, openapi, swagger, api-contracts, nestjs, guilds, technical-enablement

**Hero scope:** Improved the internal developer platform at Riverside by standardizing how microservices were created, instrumented, and released.

**Architecture:** Microservice templates + shared internal libraries for Kafka and logging + OpenAPI/Swagger-by-default API contracts for new services + GitHub Actions release pipelines + Docker-based service packaging

**Key decisions:**
- Proposed creating Riverside's first dedicated platform team as the company grew and the need for internal infrastructure became unavoidable.
- Partnered with the incoming VP of Engineering to reshape an existing team, move user-facing ownership to more relevant product teams, and free the new platform team to focus on leverage for the broader organization.
- Created reusable service templates so new microservices started from a consistent baseline instead of custom one-off setups.
- Standardized OpenAPI/Swagger as a default requirement for new endpoints, first by introducing it into the monolith and then by shipping it out of the box in new NestJS microservices through decorator-based API definitions.
- Built shared company libraries for Kafka consumption and logging so teams could adopt the same operational patterns across services.
- Used engineering-wide technical guilds for the biggest workflow and platform changes so teams could understand the why, see concrete examples, ask questions, and influence adoption rather than receiving a top-down rollout.
- Ran guild sessions around the new NestJS microservice templates, the first shared Kafka library and usage model, and the CI/CD / branching-model changes that simplified releases.
- Simplified release engineering from a more complicated branching model to a thinner single-branch flow: work via PRs into `main`, create a version tag or release, and let GitHub Actions deploy the latest release automatically.
- Kept Docker packaging deliberately simple so teams could ship reliably without accumulating unnecessary CI/CD complexity.
- Started measuring operational health through release frequency, alert responsiveness, and defect trends as the platform model replaced older multi-environment release habits.

**Proof points:**
- Helped define the organizational case for platform as a product, not just a support function.
- Built the first formal platform team around internal infrastructure, developer workflows, and shared engineering leverage.
- Improved developer experience by making service setup faster and more standardized across teams.
- Improved API consistency and integration readiness by making OpenAPI/Swagger documentation a default part of both legacy endpoint evolution and new microservice delivery.
- Used engineering-wide guilds to introduce major platform changes, including shared Kafka concepts and libraries, service templates, code examples, and release-model changes.
- Reduced friction in microservice delivery through a simpler GitHub Actions-based release model.
- Helped turn platform work into leverage for the broader engineering organization rather than only supporting a single team.
- Partnered directly with the platform team lead, release manager, and VP of Engineering to push the release-process redesign first through microservices and then into the monolith.

---

## Riverside -- AI Adoption in Engineering Workflow

**Tags:** ai, developer-experience, code-review, copilots, cursor, agentic-workflows, engineering-productivity, platform

**Hero scope:** Pushed Riverside's early adoption of AI-assisted engineering in a pragmatic way, starting with coding and review workflows rather than hype-driven experiments.

**Key decisions:**
- Championed the first serious use of GitHub Copilot and later Cursor across engineering teams.
- Backed a team-led initiative to introduce AI-assisted PR review, worked through the early privacy and approval concerns, and helped operationalize it as part of the delivery workflow rather than an isolated experiment.
- Introduced AI-assisted PR review to reduce review bottlenecks and surface issues earlier, before human review became the constraint.
- Treated AI as an engineering systems problem: useful when paired with clear workflows, guardrails, and internal tooling rather than as an open-ended chat interface.
- Left Riverside before the next wave of agentic automation matured, but had already been pushing the organization toward stronger internal tooling and CLI-driven workflows that AI systems could build on top of.

**Proof points:**
- Was an early internal advocate for practical AI adoption in day-to-day engineering work.
- Helped normalize AI-assisted code generation and review as part of the workflow rather than as an individual experiment.
- Improved PR flow by letting engineers run AI review earlier, so human reviewers could spend more time on business logic, product nuances, and higher-value design decisions instead of routine fixes.
- Formed a clear point of view that the strongest long-term path is AI layered on top of high-quality company tooling, templates, and workflows.

---

## Riverside -- Agile Operating Model, Planning, and Product/Design Alignment

**Tags:** agile, delivery, planning, product, design, cross-functional, operating-model, engineering-management, predictability

**Hero scope:** Improved team effectiveness at Riverside by introducing a more structured agile operating model across multiple teams during a scaling phase where product, design, and engineering were creating too much delivery churn.

**Key decisions:**
- Expanded a more structured agile approach from a single engineering-managed team to a broader group as Riverside scaled and a new VP of Engineering pushed for stronger operating discipline across the org.
- Worked through resistance from some product partners by framing the change as a way to reduce waste and rework, not add process for its own sake.
- Worked closely with product and design counterparts to improve planning quality, scope clarity, acceptance criteria, and cross-team trade-off discussions before delivery work started.
- Used the first wave of internal AI tooling to make documentation, clearer ticket descriptions, and stronger acceptance criteria easier to produce and maintain.
- Reinforced that the process should stay lightweight and only exist where it made delivery more genuinely agile, especially around planning, scope clarity, and edge-case definition.
- Connected the team-level changes to better quarterly planning, so cross-company alignment improved instead of each team planning in isolation.

**Proof points:**
- Reduced late back-and-forth between product, design, and engineering by improving scope definition and acceptance criteria earlier in the cycle.
- Improved predictability and made it easier to align multiple teams with broader company priorities.
- Reduced communication noise and delivery friction across engineering, product, and design.
- Built a tighter product-design-engineering loop where trade-offs were surfaced earlier and teams could move faster with less rework.
- Earned explicit buy-in from initially skeptical product stakeholders once the new model showed clearer planning and smoother execution.

---

## Riverside -- QA Automation Transition and Playwright Enablement

**Tags:** qa, quality, playwright, test-automation, coaching, enablement, engineering-managers, delivery, workflow

**Hero scope:** Helped shift QA work from a manual model toward Playwright-based automation during the Senior Engineering Manager phase by supporting people transition and team adoption rather than owning the QA automation function directly.

**Key decisions:**
- Supported the move away from a more manual QA model by helping manual QAs learn and transition into Playwright-based automation work.
- Treated the transition as an enablement and operating-model change, not just a tooling swap, so quality work could scale with the engineering organization.
- Coordinated with the teams and leaders directly responsible for QA automation while keeping the group focused on sustainable adoption.

**Proof points:**
- Helped train and transition manual QAs into Playwright-based QA automation during the Senior Engineering Manager period.
- Can credibly speak to QA automation enablement and rollout without overstating direct ownership of the QA automation function.

---

## Sabbatical -- AI-Native Product Builds

**Tags:** ai, llm, agentic, projects, product, local-first, grounded-search, browser-automation, hands-on

**Hero scope:** Built and shipped three products to develop a practical AI-native engineering workflow end to end.

**Products:** Verba (local-first transcription), Informia (document extraction and browser-assisted submission), FallosES (grounded legal research assistant) -- built primarily with Next.js.

**Key decisions:**
- Standardized a workflow around voice-prompted context capture, two-phase planning, TDD, and manual review.
- Built the products primarily in Next.js and used long-running workflow patterns where multi-step AI and browser tasks needed durable execution.
- Focused Verba on on-device transcription and privacy-by-default instead of cloud dependency and mandatory registration.
- Used grounded retrieval, citations, and context caching where the product demanded traceable AI behavior.

**Proof points:**
- Kept hands-on product building current during the sabbatical rather than treating AI as a purely managerial topic.
- Built the sabbatical products primarily in Next.js, including workflow-heavy async patterns rather than short synchronous demos.
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

---

## Riverside -- B2B Partnerships and External Platform Integrations

**Tags:** b2b, partnerships, integrations, external-platforms, podcast-hosting, product-engineering, technical-alignment, business-team

**Hero scope:** Worked on Riverside's B2B-facing product and integration surface, including direct coordination with external podcast hosting platforms and technical/product stakeholders.

**Operating model:** Riverside had B2B partnership work and later a Business team focused on the B2B side of the company. Sebastian was part of that business-facing engineering context, connecting product needs, technical constraints, and external partner integration requirements.

**Key decisions:**
- Worked on integrations with external platforms, including podcast hosting services that needed to connect with Riverside services.
- Spoke directly with external technical and product teams to understand their systems, align expectations, and shape integration contracts between platforms.
- Used the external partner context to make engineering decisions that served B2B product and business needs, not just internal implementation preferences.
- Connected this work with Riverside's broader dashboard, account, enterprise, SSO, and platform ownership.
- When Sky UK's unsupported automation broke after an internal API change, treated the failure as evidence of a real enterprise need instead of preserving the private interface they had reverse-engineered.
- Replaced that fragile path with a supported API/microservice using proper authentication and token refresh, then made the capability reusable for other business customers.

**Proof points:**
- Real B2B integration experience involving external companies, not only internal APIs.
- Direct technical/product alignment with partner teams before and during integration work.
- Strong evidence for roles that mention integrations, enterprise connections, partner platforms, health systems, employer partners, or B2B SaaS surfaces.
- Turned one customer's unsupported workaround into a supported product surface that could be offered to additional enterprise accounts.
