# Custom Instructions — Sebastian's Career-Ops

This user-layer file defines procedural rules for this fork. It may override a system-mode default, but it never supplies candidate facts. Candidate claims must still come from the approved sources in `AGENTS.md`.

## Resume workflow: JSON-first and review-first

- For real applications, default to `modes/json-cv.md` and the candidate-authored bases in `resumes/*.json`. Do not replace this with the upstream HTML, LaTeX, Canva, or generic PDF workflow unless the user explicitly asks for one of those formats.
- Treat `cv.md` as the factual source of truth and the selected JSON as the presentation base. Copy the base first, make minimal supported changes, validate the result, and keep professional experience in reverse chronological order.
- Keep application resumes one-page oriented. Prefer reordering bullets and skill groups, tightening supported language, and replacing weaker evidence over adding more content.
- Show a concrete proposed change list before additions, removals, story-bank use, or material rewrites. Never invent or silently remove evidence.
- When an evaluated role scores at least 4.0/5 and a resume artifact is appropriate, generate the tailored JSON through `json-cv`. Lower-scoring roles do not get an automatic resume unless the user explicitly overrides.
- When `RX_RESUME_URL` and `RX_RESUME_KEY` are configured, validate and sync through `npm run resume:sync`. `apply-full` must export and verify the PDF through RxResume exactly as its mode defines.

## Application authority

- `apply` is strictly read-only. It may open, inspect, scroll, and extract the live JD and visible questions, draft answers, and synchronize tracker context. It must not type into fields, select options, upload files, click through application steps, solve CAPTCHAs, or submit.
- `/career-ops apply-full <report-id>` is explicit authority for the full flow for that report only. Follow `modes/apply-full.md`, including RxResume JSON tailoring, PDF verification, an independent review gate, form filling, upload, and submission when every gate passes.
- No scan, discovery, evaluation, pipeline, scheduled task, `apply`, or `json-cv` invocation grants submission authority.
- Never guess a material answer. Pause for missing facts, identity data, compensation, work authorization, legal attestations, authentication, CAPTCHA, or reviewer escalation, then resume from the same state.
- Mark an application Applied only after visible submission confirmation or a returned application identifier.

## External application tracker

- During `apply` and `apply-full`, use `sync-application-tracker.mjs` when `APPLICATION_TRACKER_URL` is configured. The script reads the repository `.env`; do not rely on exported shell variables alone.
- Treat the exact live JD as the primary proof source and store it verbatim in `jobDescriptionText`. Reports are supporting context.
- Save `currentDraft` only when the live form explicitly asks for a cover letter.
- Default to not saving form Q&A. Save genuinely reusable substantive answers, including salary/compensation answers for recordkeeping, substantive management/hiring/coaching narratives, and useful role-specific `Additional Information` responses.
- Do not save identity boilerplate, uploads, generic authorization fields, short radio/dropdown screens, or other form-only answers. Saved Q&A defaults to `includeInAiContext: false` unless the user explicitly opts it in.
- Search prior saved answers before drafting long-form responses and reuse them only when they remain accurate and relevant.
- Keep the Markdown tracker synchronized through its TSV/merge or canonical status-script path; never add a row directly from an application mode. When updating the external stage, omit `pipelineStatus.effectiveDate` unless intentionally backfilling a timestamp.

## Voice and humanization

- Apply `voice-dna.md` and `modes/_writing.md` to candidate-facing prose. Prefer direct, specific, natural language over polished-but-generic AI phrasing.
- Remove inflated symbolism, promotional language, vague attribution, shallow analysis, repetitive transitions, excessive em dashes, and formulaic three-part constructions.
- Preserve the local `humanizer-zh` skill. When producing Chinese candidate-facing prose, use it as a final editing pass when available without altering facts or form constraints.

## Discovery and scanning

- Use the upstream 1.24 provider-based scanner and official `web/` experience for broad discovery.
- Retain the logged-in browser workflows in `scan-jobgether` and `scan-wttj`; use their deterministic helpers and cleanup rules rather than reimplementing portal logic.
- Keep `portals.yml` as the candidate's source of search filters, target companies, exclusions, and location rules.
