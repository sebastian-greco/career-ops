# Story Bank — Master STAR+R Stories

This file accumulates your best interview stories over time. Each evaluation (Block F) adds new stories here. Instead of memorizing 100 answers, maintain 5-10 deep stories that you can bend to answer almost any behavioral question.

## How it works

1. Every time `/career-ops oferta` generates Block F (Interview Plan), new STAR+R stories get appended here
2. Before your next interview, review this file — your stories are already organized by theme
3. The "Big Three" questions can be answered with stories from this bank:
   - "Tell me about yourself" → combine 2-3 stories into a narrative
   - "Tell me about your most impactful project" → pick your highest-impact story
   - "Tell me about a conflict you resolved" → find a story with a Reflection

## Stories

<!-- Stories will be added here as you evaluate offers -->
<!-- Format:
### [Theme] Story Title
**Source:** Report #NNN — Company — Role
**S (Situation):** ...
**T (Task):** ...
**A (Action):** ...
**R (Result):** ...
**Reflection:** What I learned / what I'd do differently
**Best for questions about:** [list of question types this story answers]
-->

### [Leadership] Scaling a distributed engineering group at Riverside
**Source:** Report #060 — RevenueCat — Engineering Manager
**S (Situation):** Riverside was scaling quickly across multiple remote teams and needed stronger leadership structure.
**T (Task):** Build a more effective operating model while keeping delivery moving.
**A (Action):** Led a group of 27 engineers and managers across 4 teams, reviewed architecture, coached leads, and helped shape hiring.
**R (Result):** The organization gained more structure, stronger technical decision-making, and clearer execution across platform and feature teams.
**Reflection:** Strong remote leadership is mostly about clarity, trust, and leverage, not extra process.
**Best for questions about:** distributed leadership, team scaling, hiring, mentoring, engineering management

### [Architecture] Evolving a monolith without stopping delivery
**Source:** Report #061 — RevenueCat — Senior Software Engineer, Agents
**S (Situation):** Riverside's backend monolith was under pressure as the company scaled.
**T (Task):** Improve system shape and reliability without freezing product delivery.
**A (Action):** Guided the move toward an event-driven architecture using Kafka and Protobuf, while continuing to support active product work.
**R (Result):** The team improved architecture and later contributed to a 33% reduction in overall latency.
**Reflection:** The best architecture work improves delivery and reliability at the same time; it should not become an isolated technical project.
**Best for questions about:** system design, trade-offs, platform evolution, reliability, backend architecture

### [AI Adoption] Introducing AI-assisted engineering with guardrails
**Source:** Report #061 — RevenueCat — Senior Software Engineer, Agents
**S (Situation):** AI coding tools were emerging, but teams needed a practical way to adopt them responsibly.
**T (Task):** Improve engineering leverage without lowering code quality.
**A (Action):** Piloted Cursor and GitHub Copilot in real workflows, normalized usage patterns, and brought AI-assisted development into team practice.
**R (Result):** AI tooling became part of the engineering workflow rather than an ad hoc experiment.
**Reflection:** New tooling works when it is operationalized with judgment and standards, not when it is rolled out as hype.
**Best for questions about:** AI adoption, technical leadership, change management, productivity, engineering leverage

### [Product Leadership] Building a formal product-platform team at Riverside
**Source:** Report #063 — Ashby — Engineering Manager, EU
**S (Situation):** Riverside started from a flatter engineering structure, which made ownership and delivery boundaries less clear as the company grew.
**T (Task):** Create a healthier team structure while keeping delivery moving.
**A (Action):** Consolidated engineers into the company's first formal full-stack team, covering core platform services and the main user dashboard, then grew the team with additional hiring.
**R (Result):** The team became a stronger platform group with clearer ownership and better execution.
**Reflection:** Good org design is often the fastest path to better delivery because it improves judgment, ownership, and communication at the same time.
**Best for questions about:** org design, team building, product engineering, delivery systems, leadership under growth

### [Founder/Product] Turning ambiguity into a market-ready SaaS company
**Source:** Report #066 — A.Team — Forward Deploy - Engineering Manager (AI Solutions)
**S (Situation):** Streamix started as an early-stage idea in a complex video product space with no existing operating model to lean on.
**T (Task):** Turn the concept into a real product while balancing product, engineering, and business trade-offs.
**A (Action):** Led product strategy and technical vision, built the team, pitched investors, and pushed the company from concept toward a usable SaaS platform.
**R (Result):** Streamix reached a market-ready product stage and earned a place in the Startup Bootcamp accelerator.
**Reflection:** Ambiguity gets easier when you connect technical decisions directly to customer value and keep the team focused on the next real milestone.
**Best for questions about:** startup leadership, ambiguity, product judgment, cross-functional trade-offs, founder mindset

### [Architecture] Fixing cascading OOM failures during hyper-growth
**Source:** Manual story capture — Riverside
**S (Situation):** During a 15x hyper-growth phase at Riverside, the core Node.js monolith started suffering cascading Out-Of-Memory failures, with instances crashing sequentially under load.
**T (Task):** Stabilize production quickly while identifying the real source of memory pressure, without defaulting to a short-term infrastructure-only fix.
**A (Action):** Led the architectural decision to start strangling the monolith into three domain-specific services and fully separate Kafka consumers to isolate heavy async processing. In parallel, we built a diagnostic pipeline with cross-service tracing and guardrails to flag oversized payloads and abnormal trace volume. That endpoint-by-endpoint analysis showed that Editor endpoints were producing massive JSON objects, and hydrating those documents through Mongoose was exhausting process memory.
**R (Result):** We optimized the queries, stopped the crashes, and kept the tracing system in place as a permanent performance standard. That broader observability work later contributed to a 33% reduction in overall system latency.
**Reflection:** Scaling issues are often symptoms, not root causes. The right fix is usually a mix of architecture, instrumentation, and discipline rather than simply throwing more hardware at the problem.
**Best for questions about:** scaling systems, diagnosing production failures, backend performance, monolith decomposition, architecture under pressure

### [Migration] Delivering a zero-downtime authentication state migration
**Source:** Manual story capture — Riverside
**S (Situation):** Riverside needed to decouple authentication to route traffic securely through an API Gateway, which meant migrating millions of active sessions from a legacy Express and MongoDB monolith using passport.js to a JWT-based service backed by Redis.
**T (Task):** Complete the migration with zero downtime while users were actively recording live audio and video, where any dropped session would be highly visible and disruptive.
**A (Action):** As Team Lead, I designed a phased parallel-run migration. I built the frontend library and backend foundation, then used the project to mentor a less senior developer into rollout ownership. We introduced the API Gateway, dual-issued JWTs and legacy cookies, and only stopped refreshing legacy cookies once the frontend was reliably handling JWT refresh flows.
**R (Result):** We watched the legacy MongoDB sessions drain naturally over their 14-day expiration window while Redis absorbed the new load, completing a large active-state migration with zero downtime.
**Reflection:** The safest migrations are usually gradual and observable. Strong technical design matters, but using the work to grow other engineers creates more leverage than owning every critical path yourself.
**Best for questions about:** zero-downtime migrations, authentication systems, risk management, technical leadership, mentoring through delivery

### [Cross-team Delivery] Orchestrating an AI dubbing workflow across siloed teams
**Source:** Manual story capture — Riverside
**S (Situation):** We were building an AI-powered dubbing workflow where editing a transcribed word would regenerate cloned audio, update lip-sync in the video, and refresh subtitles. The work depended on three separate teams, Editor, AI, and Platform, and they were badly misaligned as the deadline approached.
**T (Task):** Create a reliable orchestration layer and get three teams aligned on a strict temporal workflow without introducing long-term integration debt.
**A (Action):** As Group Lead, I stepped in to define the system boundaries and async data contracts. Because the transcription service was not yet fully migrated to Kafka, I designed the integration to consume legacy webhooks first, but added a feature flag so we could later switch to Kafka events cleanly. I delegated implementation of the contracts to a mid-level engineer on my team while guiding the AI and Editor teams to own their parts of the workflow.
**R (Result):** We delivered the orchestration layer on time. It became the AI team's first successful event-driven integration, and I was recognized by the VP of Engineering for bridging the gap between siloed teams to ship a complex multi-domain feature.
**Reflection:** Cross-team delivery problems are often coordination problems disguised as technical ones. Clear boundaries, explicit contracts, and strong ownership matter more than trying to centralize all the coding.
**Best for questions about:** cross-functional leadership, event-driven systems, shipping under deadline, resolving team misalignment, complex integrations

### [Platform Ownership] Owning billing and payment capabilities without overbuilding the stack
**Source:** Manual story capture — Riverside
**S (Situation):** When I joined Riverside as an early full-stack engineer, the payments setup was still very simple: Stripe plus webhooks. The company needed a more reliable internal model for plans, features, entitlements, and billing behavior as the product got more sophisticated.
**T (Task):** Support monetization and entitlement flows reliably without turning the team into a pseudo-fintech org or rebuilding infrastructure that Stripe already handled well.
**A (Action):** I designed the database-backed model that gave Riverside proper control over plans, features, and entitlements while keeping Stripe as the execution layer for payments. That gave us a cleaner separation between product logic and payment processing, and it meant we could evolve monetization behavior in-house without rebuilding payment primitives ourselves. Later, once I had moved into team leadership and the organization formalized, that ownership remained within my scope and eventually sat inside the broader Platform team.
**R (Result):** Riverside gained a much more robust foundation for monetization, the product team could move faster on billing-related changes, and we created a practical base for later work like usage-based AI token consumption.
**Reflection:** Strong platform ownership is not about building everything yourself. It is about being clear on which capabilities are strategic to own, which should be delegated to a specialist platform, and how to connect them cleanly.
**Best for questions about:** platform strategy, billing systems, payment integrations, buy-vs-build decisions, product/platform ownership, technical judgment

### [Product Judgment] Shipping an AI token ledger with the right first scope
**Source:** Manual story capture — Riverside
**S (Situation):** By the time we were monetizing AI features, I had already owned Riverside's plans, billing, and payment-product logic for quite a while, starting from the early Stripe-plus-webhooks setup and later carrying that scope into leadership. As AI features became expensive to run, we needed a ledger so users could purchase and spend tokens cleanly inside the product.
**T (Task):** Design the system so it could scale into a complete financial ledger later, while deliberately limiting the first release to the minimum viable scope.
**A (Action):** Worked closely with Product to identify the smallest slice that still delivered the core user experience. I designed the ledger as an event-driven system that fit cleanly with our existing Stripe-backed purchase flow, but we intentionally launched only the essential purchase and spending events. We deferred the user-facing transaction history and built a simple manual support tool instead of full refund automation, betting that the initial edge-case volume would be manageable operationally.
**R (Result):** That compromise reduced shipping time significantly, let us launch tokenized AI consumption without blocking on edge-case infrastructure, and avoided technical debt because the architecture already supported later additions like automated refunds, credits, and transaction visibility.
**Reflection:** Good engineering is not maximalist engineering. The best early design gives the business what it needs now without closing the door on the more complete system later.
**Best for questions about:** product trade-offs, pragmatic architecture, balancing speed and quality, payments and ledger systems, fintech-style systems, working with Product

### [AI-native Development] Using a sabbatical to build practical AI systems end to end
**Source:** Manual story capture — Sabbatical projects
**S (Situation):** I took an intentional sabbatical to get deeply hands-on with modern AI-driven development workflows and agentic systems rather than only understanding them from a leadership distance.
**T (Task):** Build real products end to end, develop a repeatable AI-native way of working, and turn that time into practical engineering capability rather than experimentation for its own sake.
**A (Action):** Built and shipped three applications from scratch: Verba, FallosES, and Informia. Along the way, I developed a deterministic workflow that combined voice-prompted context building, two-phase planning, and TDD-based validation. One of the clearest outputs was Verba, a local-first transcription product that runs AI models on-device and avoids cloud dependency and mandatory user registration.
**R (Result):** The sabbatical gave me practical experience with LLM integration, agentic workflows, API-heavy product development, and privacy-first local deployment patterns that I can now bring back into a team environment.
**Reflection:** AI becomes much more valuable when treated as an engineering system, not a magic layer. The combination of planning discipline, validation loops, and product judgment matters more than novelty on its own.
**Best for questions about:** self-directed learning, AI systems, modern engineering workflows, privacy by design, building from scratch

### [AI Product & Architecture] Building Riverside's first LLM microservice and flagship AI features
**Source:** Manual story capture — Riverside
**S (Situation):** Riverside wanted to leverage AI to extract value from podcast transcriptions, starting with automated Show Notes and later Magic Clips. At the time, we were using GPT-3 with severe context window limitations, and there was no existing AI infrastructure in the company.
**T (Task):** Build the first LLM-powered features from scratch, overcome the technical limitations of early LLMs, and create a scalable way for other teams to build AI features without reinventing the wheel.
**A (Action):** My team built Show Notes (summaries, chapters, timestamps) and Magic Clips (viral highlights). To make it work with GPT-3, we implemented context splitting and summarization pipelines. Recognizing this would be a company-wide need, we built it as a foundational microservice that handled quota management, transcription packaging, and context window limits. We also worked closely with Product on prompt iteration. Later, we instrumented the features to capture usage data (saves, exports, votes), which we fed to our internal AI team to train a custom fine-tuned model.
**R (Result):** We shipped Riverside's most famous AI features. Our microservice became the backbone for all subsequent AI features built by other teams (blog posts, translations). As a Senior EM, I later used this foundation to orchestrate multi-team efforts like Video Dubbing.
**Reflection:** Getting to market first with AI requires pragmatic engineering to bypass model limitations. But turning that into a platform capability (microservice + data flywheel for fine-tuning) is what creates lasting company value.
**Best for questions about:** AI integration, LLMs, microservice architecture, greenfield projects, working with product, scaling AI features.

### [Leadership Growth] Building teams that could count on me without depending on me
**Source:** Sourcegraph peer and values interviews — Riverside
**S (Situation):** I moved from Engineering Manager to Group Lead during a reorganization after the Head of Engineering left. I suddenly had multiple teams, new leaders to support, and a direct reporting line to the CEO, and I responded by trying to jump into every gap myself.
**T (Task):** Keep delivery moving while learning how to lead through other people instead of becoming the bottleneck for a 27-person group.
**A (Action):** I raised the workload problem with the CEO. He reviewed my calendar with me and gave me candid feedback: people should be able to count on me, but they should not depend on me. I initially resisted because I believed work would stall if I did not intervene. I then changed the job I thought I was doing—delegated outcomes rather than tasks, coached team leads, clarified decision ownership, and measured my success through the independence of the teams rather than my personal involvement.
**R (Result):** The leaders and teams became increasingly self-sufficient. I could step away without delivery stopping, and I reached the point where I could tell the CEO—only half joking—that one of the teams would be fine if he fired me the next day.
**Reflection:** A manager who rescues every situation may feel useful while quietly preventing the organization from growing. Leadership leverage means being available and accountable without making every path run through you.
**Best for questions about:** constructive feedback, delegation, manager-of-managers growth, key-person risk, changing leadership style, scaling yourself

### [People Management] Recovering a high-potential senior engineer from near dismissal
**Source:** Sourcegraph peer interview — Riverside
**S (Situation):** A new VP asked me to take on a brilliant but demoralized senior engineer whom leadership was considering dismissing. He solved difficult problems and helped everyone, but struggled to focus, estimate his work, communicate delays, and finish team commitments predictably.
**T (Task):** Preserve his unusual technical value while making his way of working reliable enough for the team.
**A (Action):** I was direct about both sides of the problem: his ownership and problem-solving were valuable, but when his work slipped the whole team slipped. I paired a deep server-side problem that played to his strengths with bounded SLA tickets, bugs, and cross-team dependencies. We agreed that getting stuck was acceptable; going silent was not. I coached him over time to ask for help, narrow investigations, say no to interruptions, and surface risks early.
**R (Result):** He began asking for help openly and became more predictable without losing the strengths that made colleagues want to work with him. About eight months later, I gave him an above-average performance review, approved by the same VP who had originally been considering dismissal.
**Reflection:** Performance management works best when it is specific about the cost of a behavior, equally clear about the person's value, and designed around observable changes—not vague encouragement or a surprise ultimatum.
**Best for questions about:** difficult feedback, performance recovery, coaching senior engineers, retention, accountability, adapting management style

### [Product Leadership] Reprioritizing global search to protect users during a major navigation change
**Source:** Sourcegraph cross-functional and Pennylane product/design interviews — Riverside
**S (Situation):** Riverside was moving recordings from a studio-bound structure into account-wide projects. The migration supported the product vision, but heavy users with hundreds or thousands of recordings risked losing the familiar places where they found their work.
**T (Task):** Protect customer workflows without derailing a major product migration that was already far along.
**A (Action):** My team raised the discovery risk with Product and Design using real account shapes rather than a generic technical objection. Once it was clear the core direction would remain, we collaborated on targeted UX changes and pulled global search forward so users had a reliable way to recover content across the new hierarchy. We monitored complaints, project creation and renaming, acceptance of automatic grouping, search usage, and the core recording metrics.
**R (Result):** Core usage did not show a significant decline, heavy users actively adopted projects, many other users accepted the automatic grouping, and global search was well received.
**Reflection:** Product leadership is not winning every disagreement. It is making the customer risk concrete, preserving the strategic direction where it still makes sense, and finding the highest-leverage mitigation.
**Best for questions about:** product judgment, customer empathy, disagreement with Product, prioritization, large migrations, data-informed rollout

### [Customer/Product] Turning an unsupported enterprise workaround into a reusable API
**Source:** Sourcegraph technical interview — Riverside / Sky UK
**S (Situation):** Sky UK had automated its Riverside workflow by reverse-engineering internal authentication and APIs. An internal change broke that workflow, and the customer complained even though the interface had never been supported.
**T (Task):** Restore the customer's business workflow without freezing Riverside's private interfaces or creating a one-off exception.
**A (Action):** We treated the workaround as product discovery. I worked directly with the customer's technical side to understand the real integration need, then helped create a supported API/microservice with explicit authentication, tokens, and refresh behavior rather than repairing the hack.
**R (Result):** Sky received a stable integration path, Riverside could continue changing its internals safely, and the same capability became useful for additional business customers and enterprise upsell conversations.
**Reflection:** Customers who work around your product are often showing you a missing product surface. The right response is not always to block the behavior; sometimes it is to turn the validated need into a supported contract.
**Best for questions about:** customer discovery, enterprise integrations, API product strategy, turning incidents into opportunities, B2B collaboration

### [Failure & Reflection] Launching on-call before the operating system was ready
**Source:** Scalapay CTO interview — Riverside
**S (Situation):** Riverside needed broader production support as it scaled, and I pushed for a rotating on-call model while the company lacked mature alerting, complete observability, clear compensation, and stable operational ownership.
**T (Task):** Spread production responsibility beyond a few leaders and improve incident response.
**A (Action):** I advocated for a rotation and for better tooling, including PagerDuty-style alerting, while the company had gaps in DevOps leadership. We improved logs and later added Datadog APM and cross-service tracing, but I allowed the rotation proposal to move without first securing all of the prerequisites and boundaries.
**R (Result):** The operating model did not become sustainable; I remained the default escalation path, including informal late-night WhatsApp alerts, which preserved key-person risk instead of removing it. The company formalized more of the missing system around the time I left, but later than it should have.
**Reflection:** I would now make the prerequisites explicit before calling something an on-call rotation: owned services, actionable alerts, runbooks, escalation policy, compensated participation, observability, and executive agreement on the load. If those are not funded, the honest decision is to limit the promise—not quietly absorb the gap myself.
**Best for questions about:** failure, burnout prevention, on-call design, influencing executives, operational maturity, what you would do differently
