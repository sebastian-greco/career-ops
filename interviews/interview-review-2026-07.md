# Interview Review — July 2026

This review consolidates the Pennylane, Scalapay, Sourcegraph, and Recare interview records. It separates direct evidence from inference so that future interview preparation does not turn a rejection into a story the evidence cannot support.

## Executive read

The four processes do not show a general inability to compete for strong Engineering Manager or Senior Engineering Manager roles.

- **Scalapay:** strong process; the company changed the role strategy after the interviews and prioritized a Director of Engineering with banking experience. This is not a performance rejection.
- **Sourcegraph:** strong full loop; the final email gave no candidate-specific feedback. In his delayed status reply, the CEO described Sebastian as one of several strong overlapping candidates. Any explanation beyond comparative selection is inference.
- **Pennylane:** the clearest actionable interview miss. The early and system-design rounds were positive, but the Product/Design round did not consistently demonstrate Senior-EM-level product partnership and organizational altitude. Pennylane was willing to discuss continuing at Engineering Manager level; Sebastian declined.
- **Recare:** no rejection. The search was paused, so this remains a dormant lead rather than a failed process.

The most consistent strengths across the interviews were technical credibility, scale-up experience, AI fluency, candor, culture fit, and the ability to connect architecture to business constraints. The most consistent presentation risk was **answer shape**: long exploratory answers sometimes buried the decision, scope, and outcome.

## Cross-process lessons

### What landed well

1. **Technical depth without pretending to be a specialist.** The authentication migration, early LLM platform, observability work, event-driven systems, and Scalapay case study all showed strong architectural reasoning.
2. **Pragmatic product-platform judgment.** The plans/entitlements system, AI token ledger, projects/global-search migration, and supported Sky API all connect engineering decisions to revenue, customer experience, or business autonomy.
3. **Authentic leadership growth.** The CEO feedback about becoming less central and the recovery of a struggling senior engineer are stronger than generic management philosophy because they show changed behavior and outcomes.
4. **Candid self-awareness.** Sebastian acknowledged where he had been too detailed, where an on-call rollout failed, and where Riverside's organizational model created friction. Interviewers generally responded well to the honesty.
5. **High-quality questions.** Asking what success would look like one year after hiring repeatedly produced useful strategic conversations with executives.

### What to change

1. **Lead with the answer.** Use: conclusion → two or three actions → result → reflection. Do not narrate the search for an example aloud.
2. **Match the altitude.** For a Senior EM question, begin with the multi-team or organizational decision. The Pennylane Product/Design round repeatedly had to clarify whether an example came from Sebastian as a team manager or as a manager of managers.
3. **Keep Riverside's dysfunction as context, not the headline.** Explaining that Product and Engineering were structurally separated may be true, but it can overpower evidence of Sebastian's own product leadership.
4. **Use customer and business outcomes before process mechanics.** Planning ceremonies, ticket ownership, and refinement details are supporting evidence. Start with the customer problem, trade-off, decision, and measurable signal.
5. **Cover system design breadth before depth.** Pennylane explicitly praised the technical instincts and caveat coverage but asked for a more concise, multi-layered pass over the complete system before component detail.

## Pennylane

**Outcome:** Rejected for Senior Engineering Manager; Pennylane indicated a possible Engineering Manager path, which Sebastian declined.

### Direct evidence

- The first substantive leadership round received explicitly strong feedback: solid candidate, clear communication, relevant fast-growth experience, humility, mature speed/quality trade-offs, hands-on credibility, and unusually current AI experimentation.
- The system-design round was also positive. The interviewers said Sebastian understood the case, identified important caveats, asked relevant questions, and had good instincts.
- The system-design improvement was specific: be more concise, spend less time on non-critical details, and use a layered end-to-end approach before drilling down.
- The follow-up email after the rejection said the people he met felt a strong culture fit.

### Product/Design miss

The round began with a long description of Riverside's delivery process rather than a crisp Senior-EM product-leadership example. When asked about collaboration at Sebastian's own level, the answer needed clarification. Several later answers emphasized that Riverside's Product and Engineering structures were separated, that PMs wrote tickets, and that alignment became noisy above the squad level.

Those details were honest, but they made the organizational weakness more memorable than Sebastian's own contribution. The strongest product evidence came later:

- raising discovery risk during the projects migration and reprioritizing global search;
- iterating Magic Clips with Product through prompts, feature flags, export/publish signals, and a later fine-tuned model;
- recognizing the limits of AI-generated design and insisting on structured briefs and human review.

### Better framing for the same round

> "At Group Lead level, my role was to make sure four teams and their Product/Design counterparts were solving the same customer problem, especially where one team's roadmap changed another team's surface. A good example was the move from studios to projects: Engineering identified that heavy users could lose discoverability, we made the customer risk concrete with real account shapes, and—because the migration was too far along to reverse—we changed the UX and pulled global search forward. We tracked adoption, complaints, search usage, and core recording behavior. The migration held its core metrics, and search was well received. My role was not to arbitrate Product versus Engineering; it was to keep the product direction while removing a customer failure mode." 

### Interpretation

This was a real interview-performance and scope-demonstration gap, not a lack of product experience. The corrective action is stronger retrieval and framing at Senior-EM altitude, not inventing new experience or automatically retargeting all searches to EM.

## Scalapay

**Outcome:** Rejected after the company changed the planned hire from Payments Engineering Manager to a Director of Engineering with banking experience. The company said it may revisit Sebastian for Payments in roughly five or six months if he is still available; meanwhile the Director will cover that area.

### Direct evidence

- The recruiter repeatedly described the core requirement as a safe pair of engineering-management hands and initially treated payments-domain depth as learnable rather than mandatory.
- The CTO round covered growing leaders, inheriting a team after a respected manager left, scale-up process failures, architecture governance, on-call lessons, observability, and business/product judgment.
- Johnny and Marco approved progression after the case study, and the recruiter reported that Johnny was very happy with the candidacy.
- The CEO round reached the intended final-stage topics. Sebastian gave a commercially grounded plans/entitlements story, reasoned acceptably through the BNPL market-sizing prompt, and asked a strong question about AI's future role in the product.

### Best reusable evidence

- **Plans/features/entitlements:** converted a request for one additional pricing tier into a durable commercial capability with account overrides and internal autonomy for Sales/CSMs.
- **Leadership development:** identified two different growth gaps in future team leads and coached each through shadowing, progressive ownership, and feedback.
- **Failure story:** the on-call rotation was pushed before tooling, ownership, compensation, and observability were ready; Sebastian became the default escalation path and now has a much sharper prerequisite model.
- **Case-study signal:** strong payment-platform reasoning despite openly stating that regulated banking was not his background. Keep this as interview evidence, not as claimed production banking experience.

### Interpretation

The final outcome is consistent with a changed company strategy, not a hidden interview collapse. Do not rewrite the story as "banking was always required": early interviewers explicitly said otherwise, and the company later changed the profile it wanted as its banking strategy became more central.

## Sourcegraph

**Outcome:** Rejected after completing the full loop; another direction/candidate was selected.

### Direct evidence

- The process covered recruiter, CEO/hiring manager, cross-functional/values, technical, and peer leadership interviews.
- The technical round engaged deeply with the early LLM microservice, prompt/output limitations, fine-tuning, team design, customer contact, and AI-native engineering workflows.
- The cross-functional and peer rounds elicited several of Sebastian's strongest stories: zero-downtime authentication, projects/global search, token-ledger compromise, delegation after CEO feedback, and performance recovery.
- After a long post-loop delay, Sebastian wrote directly to CEO Dan Adler. Dan apologized and said Sourcegraph had several strong overlapping candidates, explicitly including Sebastian, while it worked through the decision.
- Devon's final rejection was generic and provided no interview-specific reason. Sebastian asked for feedback; none is present in the reviewed thread.

### Possible risks, clearly marked as inference

- The role was a small, product-heavy player-coach team. Sebastian's recent scope was much larger, and in the CEO conversation he was careful about how much production coding an EM could responsibly own. That could have created comparison risk against candidates with more recent small-team player-coach experience, but Sourcegraph did not say this.
- Several answers were long. This is visible in the transcripts, but there is no evidence that it drove the decision.
- The company had recently changed leadership and product structure and was comparing many candidates. Comparative fit may simply have been narrow.

### Interpretation

Treat this as a strong but unsuccessful loop with no diagnostic rejection feedback. The correct lesson is to reuse the excellent stories and tighten their delivery—not to manufacture a Sourcegraph-specific weakness.

## Recare

**Outcome:** Search paused; recruiter indicated the company would circle back when it resumes. Still open but dormant.

### Direct evidence

- The recruiter positioned the role between two extremes: technically credible enough to steer Recare through an AI-native transition, but not so removed from execution that the leader could only operate at a high level.
- Sebastian connected that need to Riverside's growth without a VP of Engineering, his direct work with the CEO, operating-model changes, and his current hands-on AI work.
- The conversation showed good mission and role alignment, but it was only an initial recruiter screen. There is not enough evidence yet to treat it as validation from the hiring team.

### Next posture

Keep the relationship warm without treating it as active pipeline. If the search restarts, lead with a 30/60/90-day AI-engineering transformation story: assess current workflows and team maturity, choose one or two measurable pilots, establish review/quality guardrails, and scale only after showing delivery or quality impact.

## Story-bank changes from this review

The strongest missing stories have been added to `interview-prep/story-bank.md`:

1. Building teams that could count on Sebastian without depending on him.
2. Recovering a high-potential senior engineer from near dismissal.
3. Reprioritizing global search during the projects migration.
4. Turning Sky UK's unsupported workaround into a supported enterprise API.
5. Launching on-call before the operating system was ready.

The article digest now also carries the durable proof points for performance recovery, the projects/global-search product decision, the delegation lesson, and the supported enterprise API.
