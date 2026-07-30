# Interview Intel: Scalapay -- Engineering Manager, Payments

**Report:** `reports/473-scalapay-engineering-manager-payments-2026-06-04.md`  
**Researched:** 2026-06-11  
**Sources:** Recruiter CTO prep PDF, first recruiter transcript/notes, stored JD, evaluation report, story bank, CV/profile, Brave Search snippets for Scalapay/Glassdoor/EIB/Greenhouse context

## Process Overview

- **Current round:** 45-minute CTO interview with Johnny Mitrevski.
- **Format:** Introductions -> hard team-stability story -> system design / databases at volume -> security and regulation -> long-lived teams -> Scalapay context and next steps.
- **Likely full process:** recruiter screen -> CTO interview -> case study / cross-functional panel -> final CEO conversation.
- **Scored areas:** resilience, ambiguity, technical excellence, performance and scale, security culture, long-lived teams and succession, people leadership, regulated environment.
- **Decisive areas:** technical excellence at scale, performance and scale, security culture.
- **Known quirk:** Johnny scores down if he has to pull technical depth out of you. Bring the queue/database/security trade-offs early.

## Role Reality From First Interview

- The stored JD says around 16 engineers, but the recruiter screen clarified the inherited team is closer to 9 engineers.
- The team has 3 principal/staff-level technical leaders. Your value is not to out-code them; it is to structure execution, unblock trade-offs, manage careers, and translate CTO/CEO strategy into operational milestones.
- The prior EM had roughly 4 years tenure but preferred the technical/principal track over people management. This is not framed as a crisis backfill.
- There is a product-side Director of Payments / payments leader. You would partner with Product, Finance, Treasury, Risk, Compliance, Customer Operations, acquirers, PSPs, card schemes, and banking partners.
- Engineering is about 80 people total: roughly 30 in Australia and 50 in Italy/Europe, with B2B payments, B2C, data, infrastructure, and IT governance groups.
- Recruiter positioning: Scalapay wants a safe pair of hands, operational and engineering excellence, and someone who can structure a growth-stage payments org without burning people out.

## What To Lead With

Your opening should not be generic EM biography. It should be:

> I have spent the last few years scaling engineering through the messy middle: from early startup execution into structured teams, platform ownership, and architecture review across a 27-person group. The strongest fit here is not that I have spent five years inside a bank. I have not. It is that I have led money-adjacent platform systems, billing, entitlements, Stripe-backed flows, and an event-driven AI token ledger while also building leaders, hiring, and turning ambiguous strategy into delivery structure.

Then immediately cover the three scorecard risks:

- **Scale:** Kafka, service extraction, isolated consumers, tracing, OOM stabilization, 33% latency reduction.
- **Money systems:** Stripe-backed billing, plans/features/entitlements, RevenueCat bridge, event-driven token ledger, correctness over speed.
- **Security culture:** OWASP as design checklist, threat modeling, least privilege, secrets, scanning, safe defaults, junior engineers choosing safe patterns.

## Round Breakdown

### Round 1: CTO Interview

- **Duration:** 45 minutes.
- **Conducted by:** Johnny Mitrevski, Scalapay CTO and co-founder.
- **What he evaluates:** Can you independently show technical depth, scale judgment, security culture, people leadership, and comfort with regulation.
- **Preparation target:** Do not wait for prompts. On every answer, state the method, trade-off, and operational lesson.

### Later Round: Case Study / Cross-Functional Panel

- **Evidence:** Adjacent Scalapay Greenhouse roles describe a case study followed by stakeholder debrief; the stored JD also lists a cross-functional panel.
- **Likely evaluation:** How you structure ambiguous payments/org problems, communicate trade-offs, and partner with product/compliance/risk.
- **Preparation target:** Expect a scenario around payment reliability, ledger/reconciliation, delivery risk, or team structure.

### Later Round: CEO Conversation

- **Evidence:** Stored JD and adjacent public Scalapay Greenhouse roles mention final CEO chat.
- **Likely evaluation:** Values, ambition, company fit, pace, and whether you can operate close to exec strategy.
- **Preparation target:** Show high ownership and ambition, but ask directly about sustainable pace and culture because that matters to you.

## Likely Questions And Best Angles

### Technical Excellence

**Question:** Tell me about a hard technical decision you led.  
**Source:** Recruiter PDF / scorecard.  
**Best story:** Evolving the Riverside monolith without stopping delivery.  
**Answer shape:**

- Start with the pressure: 15x growth, cascading OOM failures, Node.js/MongoDB monolith, heavy async consumers.
- Say the design choice before being asked: isolate heavy async work, separate Kafka consumers, add tracing/correlation IDs, identify oversized payloads, avoid only scaling hardware.
- Include the trade-off: service extraction adds operational overhead, but isolation and observability beat a fragile shared process under load.
- Result: stopped crashes and contributed to a broader 33% latency reduction.

**Question:** How do you think about queues and async work at scale?  
**Source:** Recruiter PDF / scorecard.  
**Best angle:** Kafka is real experience, but show you are not Kafka-biased.

- Use SQS/EventBridge when managed simplicity, lower operational burden, and straightforward fan-out/retry are enough.
- Use Kafka when throughput, replay, stream semantics, and cross-service event history justify the operational and cognitive load.
- For money movement, design for idempotent handlers, dedupe keys, outbox/inbox patterns, retries, dead-letter queues, back-pressure, and auditable state transitions.
- Explicit line: `The transport can be at-least-once; the business result must be exactly-once.`

**Question:** What do you know about database locks?  
**Source:** Recruiter PDF says Johnny probes locks.  
**Best angle:** Be practical, not academic.

- Locks are a correctness tool, but under high throughput they become a latency and availability risk.
- Keep transactions small, lock rows in deterministic order, use optimistic concurrency where conflicts are rare, use unique constraints/idempotency keys to enforce invariants, and avoid long-running work inside transactions.
- For ledger-like flows, use append-only events or immutable ledger entries plus reconciliation instead of mutating balances blindly.
- Watch for deadlocks, lock escalation, hot rows, missing indexes causing wider locks, and workers competing for the same records.

### Performance And Scale

**Question:** Have you run something at high volume? What broke first?  
**Source:** Recruiter PDF / scorecard.  
**Best story:** Cascading OOM failures during Riverside hyper-growth.

Strong framing:

> The first thing that broke was not CPU. It was memory and visibility. We had heavy JSON payloads being hydrated through Mongoose inside a monolith, and async consumers were not isolated enough. My response was to separate heavy consumers, add end-to-end tracing and correlation IDs across HTTP/Kafka, and use endpoint-level data to find the actual payload problem. The lesson was that scale problems are often observability and isolation problems before they are infrastructure problems.

**Question:** How would you handle a monthly billing run / payment spike?  
**Source:** Recruiter PDF example.  
**Best angle:** Map Riverside billing/ledger experience to Scalapay without overclaiming banking depth.

- Put spiky work off the request path.
- Use dedicated workers and queue partitions for the busiest path.
- Make every step idempotent.
- Use retries with dead-letter queues and operational dashboards.
- Separate user-facing traffic from batch/payment processing.
- Reconcile after execution; never rely only on synchronous success paths.

### Security Culture

**Question:** How do you build security habits beyond code review?  
**Source:** Recruiter PDF says this is the lowest-scoring area.  
**Best answer to practice:**

> I try to make security part of design, not a late review gate. For web systems I use OWASP Top 10 as a practical checklist: where does untrusted input enter, where could injection happen, how is authorization enforced, where are secrets stored, and what happens if a dependency is compromised. In implementation, safe ORM methods and parameterized queries are default, service accounts use least privilege, secrets live in a vault, and dependency/code scanning runs in CI. For larger features I like short threat-modeling sessions before build starts, especially around auth, billing, account state, or payment flows. Code review still matters, but the goal is that engineers choose the safe path before review because templates, examples, and team habits point them there.

Mention the zero-downtime auth migration if he asks for proof:

- Migrated millions of active sessions from legacy Express/passport.js/MongoDB sessions to JWT + Redis behind an API Gateway.
- Dual-issued JWTs and legacy cookies.
- Let old sessions drain over 14 days.
- Protected live recording flows from dropped sessions.

### Regulated Environment

**Question:** Which regulation or rule shaped a design you built?  
**Source:** Recruiter PDF / JD.  
**Risk:** You do not have direct bank/EMI operator experience. Do not fake it.

Recommended framing:

> I have not run a licensed banking engineering team, so I would not pretend SEPA, SDD, 3DS, chargebacks, or card-scheme rules are the same as my Riverside work. My adjacent experience is building systems where money, entitlements, billing state, and customer trust depended on correctness. The way I would approach the regulated part is to treat compliance as an input to design: explicit state machines, auditability, reconciliation, access controls, and early partnership with Risk/Compliance instead of treating them as a final approval step.

Then bridge to Riverside:

- Stripe-backed billing and payment flows.
- Plans/features/entitlements and account overrides.
- RevenueCat bridge for mobile billing.
- Event-driven AI token ledger scoped carefully for purchase/spend events and future refund/credit flows.

### Resilience

**Question:** Tell me about making a team stable in a hard moment.  
**Source:** Recruiter PDF / scorecard.  
**Best story:** Growth/team pressure + Riverside scaling, but avoid sounding burned out.

Good framing:

> Riverside was scaling fast, and the hard part was not only technical. Priorities shifted, hiring plans changed, and teams sometimes had Product and Engineering pulling in different directions. My approach was to make the Product Manager and Team Lead operate as a unit, tighten planning and acceptance criteria, and introduce just enough process for the stage we were in. Earlier, too much Scrum was wrong for the company; later, without more structure, alignment broke down. The lesson was to match process to company stage, not ideology.

Be careful:

- You can mention you took a sabbatical after a long high-pressure phase, but do not center the answer on burnout.
- Phrase it as: `I learned to value sustainable pace because I have seen what happens when scale, incidents, and ambiguity accumulate without enough structure.`

### Ambiguity

**Question:** How do you make sense of unclear scope?  
**Source:** Recruiter PDF / scorecard.  
**Best story:** AI dubbing orchestration across Editor, AI, Platform.

Method:

- Identify the user/business outcome.
- Draw system boundaries.
- Decide the async contracts.
- Pick reversible vs irreversible decisions.
- Split the first milestone from the complete architecture.
- Assign owners and failure modes.

Proof:

- Webhook-first integration because upstream Kafka migration was not ready.
- Feature flag to switch to Kafka later.
- Delegated implementation while aligning three teams.
- Delivered on time and created the AI team's first successful event-driven integration.

### Long-Lived Teams And Succession

**Question:** Who did you grow into a lead or successor?  
**Source:** Recruiter PDF / scorecard.  
**Best stories:** Dashboard team leads, auth migration ownership.

Use:

- Coached 2 high-performing engineers into Team Lead roles as Dashboard evolved into Platform.
- Mentored a less senior developer into rollout ownership during the JWT/session migration.
- Built leverage through team leads and EMs rather than centralizing all decisions.

Strong sentence:

> I see succession as a delivery strategy, not only a people-development activity. If the team depends on me for every critical decision, I have not built a durable team.

### People Leadership

**Question:** What is your steady management system?  
**Source:** Recruiter PDF / scorecard.  
**Best angle:** Structured but not bureaucratic.

- Regular 1:1s with leads/EMs.
- Clear ownership boundaries.
- Growth plans and feedback loops.
- Hiring calibration and final technical sign-off.
- Compensation/budget planning experience.
- PM + TL partnership as the basic execution unit.
- Watch morale/pace as an operating metric, not only delivery output.

## Story Mapping

| Likely topic | Best story | Fit | Gap |
|---|---|---|---|
| Technical depth at scale | Fixing cascading OOM failures during hyper-growth | strong | None |
| Async queues / trade-offs | Evolving a monolith with Kafka and isolated consumers | strong | Add SQS/EventBridge language |
| Payment systems | Owning billing and payment capabilities without overbuilding | strong adjacent | Be explicit this was not bank/EMI core |
| Ledger / correctness | Shipping an AI token ledger with the right first scope | strong adjacent | Prepare double-entry/reconciliation language |
| Security culture | Zero-downtime authentication state migration + OWASP operating model | partial | Practice OWASP answer out loud |
| Regulated environment | Billing/entitlements + compliance-as-design framing | partial | Do not overclaim SEPA/SDD/3DS depth |
| Ambiguity | AI dubbing orchestration across siloed teams | strong | None |
| Succession | Coached team leads + mentored auth migration owner | strong | None |
| People leadership | Scaling a distributed engineering group at Riverside | strong | Keep direct-report structure clear |
| Sustainable pace | Riverside growth/burnout lessons | partial | Frame as learned leadership principle, not complaint |

## Technical Prep Checklist

- [ ] OWASP Top 10: know the current categories and be able to apply them to payments/account flows.
- [ ] Database locking: row locks, optimistic concurrency, deadlocks, hot rows, transaction boundaries, idempotency keys.
- [ ] Queue trade-offs: SQS vs EventBridge vs Kafka; managed simplicity vs replay/throughput/stream history.
- [ ] Payment correctness: at-least-once transport, exactly-once business effect, idempotent commands, reconciliation.
- [ ] Ledger basics: append-only entries, double-entry concepts, immutable audit trail, balance derived from entries, correction entries instead of mutation.
- [ ] Payment domain vocabulary: authorization, capture, settlement, reconciliation, chargebacks, 3DS, PSP, acquirer, scheme.
- [ ] BNPL risk vocabulary: first-payment default, approvals vs risk, collections, recovery, affordability/regulatory pressure.
- [ ] Scalapay product context: BNPL across Italy/France/Spain/Portugal, online and in-store, Visa card/offline card, merchants and consumers.
- [ ] Case study style: structure problem -> constraints -> risks -> design -> trade-offs -> operating model -> first 90 days.

## Company Signals To Use

- Scalapay careers language emphasizes high standards, independent/critical thought, innovation, ownership, continuous learning, and thriving in change.
- Recruiter said the CTO is AI-positive and has built internal source-of-truth/design tooling using AI.
- Recruiter said AI tools are broadly supported, with flexible model/tool choice.
- EIB public release says Scalapay received EUR 70M scale-up debt financing to accelerate technological innovation and bolster payment-sector products and services.
- Public Scalapay/Adyen/help pages show BNPL and Scalapay card/offline payment context across Italy, Spain, France, and Portugal.
- Glassdoor snippets show mixed public culture signals. Do not mention them directly unless asked, but use your questions to test onboarding clarity, micromanagement risk, and sustainable pace.

## Questions To Ask Johnny

- `The role sounds like translating company-level payments strategy into execution through principals and team leads. Where is that translation breaking down most today: prioritization, technical decision-making, cross-functional alignment, or people leadership?`
- `For the banking-license direction, what engineering capabilities must become bank-grade first: ledger correctness, reconciliation, auditability, risk controls, incident response, or partner integrations?`
- `How do Product, Risk, Compliance, Treasury, and Engineering make trade-offs today when speed and correctness conflict?`
- `What would make the case study successful in your eyes: the technical design, the way trade-offs are explained, or the operating plan for the team?`
- `The recruiter described Scalapay as high-retention and not burnout-driven. What management habits protect that as the company pushes toward banking-level complexity?`

## Red Flags To Handle Proactively

- **Direct regulated-payments gap:** Say it plainly, then bridge to money-adjacent systems and learning method.
- **Compensation:** You already anchored EUR 110K-120K employee-equivalent as workable depending on full package. Do not reopen unless asked; later validate base + 10% bonus + options worth 30% of base.
- **Burnout history:** Frame as hard-won leadership judgment about sustainable pace, not as a reason you cannot handle intensity.
- **Hands-on vs leadership:** They want technical judgment, not a coding EM. Say you can review architecture and unblock principals without becoming the bottleneck.
- **Remote / office:** Office is optional, but execs are in Milan sometimes. Say you are remote-effective and willing to use Milan office time intentionally for exec alignment, team rituals, and high-bandwidth planning.

## Two-Minute Closing Pitch

> What I would bring to this role is a mix of engineering management and technical judgment. At Riverside I scaled from early hands-on engineering into leading a 27-person group through team leads and managers, while staying close to platform architecture, billing, entitlements, event-driven systems, and reliability work. I have not run a licensed banking team, so I would be deliberate about learning the Scalapay-specific regulatory and payment-scheme context. But I have led systems where correctness, user trust, and operational reliability mattered, and I know how to build the team habits around that: clear ownership, good technical review, observability, security habits, and leaders who can run without me becoming the bottleneck.

## One-Hour Prep Plan

1. Practice the OWASP/security answer until it is automatic.
2. Practice the OOM/scale story with queues, locks, idempotency, and trade-offs in the first 60 seconds.
3. Practice the regulated-gap bridge: honest, confident, no defensiveness.
4. Review payment vocabulary and ledger basics.
5. Pick 3 questions for Johnny from the list above.
