# Shared Evaluation Rubric -- Agentic, Standardized, Reusable

Use this rubric for **every** job evaluation, regardless of entrypoint:
- pasted URL or JD (`auto-pipeline`)
- single-offer evaluation (`oferta`)
- inbox processing (`pipeline`)
- batch workers (`batch`)

This is the source of truth for *how* offers are judged.

## Methodology Rule

**All final scoring must be agentic and use the same rubric.**

Deterministic code and regex are allowed for:
- extracting facts from the page or JD
- normalizing fields such as title, location, compensation, and apply questions
- detecting obvious hard constraints from explicit text
- rendering reports and tracker artifacts

Deterministic code and regex are **not** the source of truth for:
- archetype judgment
- culture interpretation
- overall fit scoring
- recommendation (`APPLY` / `CONSIDER` / `SKIP`)

If a script or helper produced a heuristic guess first, treat it only as a draft to verify or discard. The final report must reflect this rubric, not the heuristic draft.

## Required Inputs

Read or gather these for every evaluation:
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`
- `article-digest.md` when present
- the exact JD text
- the live job URL when available
- visible apply-form questions when available

If the JD comes from a live page, prefer the rendered live page over stale cached text.

## Standard Questions the Evaluator Must Answer

For every job, answer the same questions in the same order:

1. What is the real role family?
- Leadership, architect, staff/principal IC, hybrid, or another shape?

2. What is the true domain?
- Platform/backend, product engineering, crypto/payments, AI/agentic, data/ML, trust/safety, etc.

3. What are the strongest evidence-backed overlaps with Sebastian's profile?
- Cite proof from `cv.md` and `article-digest.md`.

4. What are the real risks?
- Separate hard blockers from manageable gaps.

5. Is this role in the North Star?
- Leadership-first by default.
- Staff / Principal / Architect roles only count as strong fits when they satisfy the selective-exception logic in `_profile.md`.

6. What does compensation look like?
- Use posted salary when present.
- If research is needed, do it the same way every time.

7. What do the cultural signals actually suggest?
- Distinguish healthy ambition from burnout-smelling urgency.
- Distinguish remote availability from true remote maturity.

8. How trustworthy does the posting look?
- Judge legitimacy separately from fit.

9. What is the final recommendation?
- `APPLY`, `CONSIDER`, or `SKIP`

## Scoring Dimensions

Use these five dimensions every time:

| Dimension | Meaning |
|-----------|---------|
| CV Match | Evidence-backed overlap with the real JD |
| North Star alignment | How well the role fits the target path in `_profile.md` |
| Comp | Compensation quality relative to targets |
| Cultural signals | Pace, flexibility, remote maturity, sustainability |
| Red flags | Risk and blocker severity |

Score each from `1.0` to `5.0`.

Then compute the global score using the same weights every time:

```text
global = 0.30 * CV Match
       + 0.30 * North Star alignment
       + 0.15 * Comp
       + 0.15 * Cultural signals
       + 0.10 * Red flags
```

Round to one decimal place.

## Interpretation Rules

- `4.5+` -> strong match, recommend applying immediately
- `4.0-4.4` -> good match, worth applying
- `3.5-3.9` -> decent but not ideal, apply only with a specific reason
- `< 3.5` -> recommend against applying

Map that to:
- `APPLY` for `>= 4.0`
- `CONSIDER` for `3.5-3.9`
- `SKIP` for `< 3.5`

Do not override this casually.

If you need to explain why a role landed at a borderline score, do so in the narrative, not by silently changing the methodology.

## Cultural Fit Guidance

Evaluate culture from explicit signals, not keyword panic.

Positive signals include:
- remote-first or truly Europe-compatible remote
- flexible hours
- parental leave
- normalized time off
- asynchronous or calm execution language
- evidence of sustainable pace

Concerning signals include:
- always-on or burnout language
- hyper-competitive / win-at-all-costs framing
- explicit office expectations
- pressure-heavy on-call or hero culture
- vague remote claims contradicted by the text

Do not treat words like `high bar`, `ownership`, or `growing quickly` as automatic negatives without context.

## Output Contract

Every evaluator should be able to produce the same structured result, even if the final user-facing artifact is markdown.

At minimum, the evaluator must determine:
- `company`
- `role`
- `archetype`
- `domain`
- `remote_model`
- `legitimacy`
- `scores.cv_match`
- `scores.north_star`
- `scores.comp`
- `scores.culture`
- `scores.red_flags`
- `scores.global`
- `recommendation`
- `strengths[]`
- `risks[]`
- `keywords[]`

## Consistency Rule for Multi-Job Runs

If evaluating multiple URLs:
- do not switch to a shallower methodology
- do not use heuristic scores as final scores for some jobs and agentic scores for others
- only change orchestration and concurrency, never the evaluation rubric

If a faster heuristic pass exists, label it explicitly as triage and do not mix its scores with final evaluation scores.
