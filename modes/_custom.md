# Custom Instructions — Sebastian's Career-Ops

This user-layer file defines procedural rules for this fork. It may override a system-mode default, but it never supplies candidate facts. Candidate claims must still come from the approved sources in `AGENTS.md`.

## Resume workflow: JSON-first and review-first

- For report #121 (Pliant — Engineering Manager, Authentication & Authorisation), keep the RxResume title as `Sebastian Greco - Pliant - EM`, including after any later sync.
- For real applications, default to `modes/json-cv.md` and the candidate-authored bases in `resumes/*.json`. Do not replace this with the upstream HTML, LaTeX, Canva, or generic PDF workflow unless the user explicitly asks for one of those formats.
- Treat `cv.md` as the factual source of truth and the selected JSON as the presentation base. Copy the base first, make minimal supported changes, validate the result, and keep professional experience in reverse chronological order.
- Keep application resumes one-page oriented. Prefer reordering bullets and skill groups, tightening supported language, and replacing weaker evidence over adding more content.
- Resume typography and layout changes require explicit approval of the concrete proposed change before editing: font family, font size, line height, spacing, margins, columns, page settings, template, and CSS. Preserve the candidate's existing values by default. A request to tailor a CV or apply for a job does not authorize these changes, and the one-page PDF gate never overrides this approval requirement. If a PDF overflows, report it and let Sebastian adjust the layout, or propose exact changes for approval; do not shrink or reformat automatically. After Sebastian edits the resume in RxResume, retrieve and preserve those edits before any sync so a stale local JSON cannot overwrite them.
- Preserve clickable links when visible CV text names a public project with a verified URL. A link stored only in a hidden Projects section does not count as visible human-review evidence.
- For leadership JSON resumes, keep the base summary and the Bothmedia entry unchanged unless Sebastian explicitly requests a rewrite.
- Keep resume summaries broad and identity-level: role direction, seniority, working style, and durable strengths. Do not compress role-specific systems, feature names, customers, or implementation details into the summary merely to match a JD. Put that evidence in experience bullets or the cover letter unless Sebastian explicitly approves a more specific summary.
- Prefer concrete, source-backed implementation terms over generic AI labels in visible skills and experience. Terms such as local LLMs, RAG, grounded search, tool/function calling, context caching, and Qdrant are useful when supported; labels such as `AI products` or `AI agents` are not useful on their own.
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

- **Always sync apply drafts:** When `APPLICATION_TRACKER_URL` is configured, `apply` should always upsert the draft and substantive questions to the external tracker before presenting the run as ready. The user's standing approval covers this apply-mode sync; surface the returned `applicationId` and stop on sync failure.

## Application resume review gate

- **Always run the JSON-CV review for applications:** Before an application is presented as upload-ready, run the `json-cv` workflow for the report. Use the live JD as the primary input, start from the correct candidate-authored base JSON, run the hard/soft skill coverage scan, make only reviewed minimal changes, validate the JSON, and sync the exact validated artifact to RxResume when configured. Keep PDF export opt-in unless the user asks for it.
- **Apply handoff:** The apply workflow must record the exact resume artifact path/version and whether it was uploaded. It must never mark the application `Applied` unless the user confirms visible submission.

- **Draft state is live state:** As soon as an `apply` or `apply-full` run has enough information to create a draft, upsert the complete current draft to the external tracker immediately. Keep that record synchronized after every material change to the JD, fit notes, answers, files, or application state; do not wait until form filling or submission.
- Save the full draft payload supported by `sync-application-tracker.mjs`, including the exact JD, report linkage, fit notes, cover-letter state, substantive answers, and current pipeline stage. The external tracker should represent the real in-progress application, not remain empty while local drafting continues.
- **Hard gate for `apply` / `apply-full`:** when `APPLICATION_TRACKER_URL` is set in the repo `.env`, upsert via `sync-application-tracker.mjs` before presenting copy-paste answers as complete or marking the apply run done. Surface the returned `applicationId` in the apply summary. If upsert fails, stop and report the error — do not silently skip. The script reads `.env`; do not rely on exported shell variables alone. If `APPLICATION_TRACKER_URL` is absent, say so once and continue without an external entry.
- Required upsert payload: `companyName`, `roleTitle`, `jobPostingUrl`, verbatim live JD in `jobDescriptionText`, `source: apply`, and `pipelineStage: draft` until submission is confirmed. Reports are supporting context only.
- Save `currentDraft` only when the live form explicitly asks for a cover letter.
- Default to not saving form Q&A. Save genuinely reusable substantive answers, including salary/compensation answers for recordkeeping, substantive management/hiring/coaching narratives, and useful role-specific `Additional Information` responses.
- Do not save identity boilerplate, uploads, generic authorization fields, short radio/dropdown screens, or other form-only answers. Saved Q&A defaults to `includeInAiContext: false` unless the user explicitly opts it in.
- Search prior saved answers before drafting long-form responses and reuse them only when they remain accurate and relevant.
- Keep the Markdown tracker synchronized through its TSV/merge or canonical status-script path; never add a row directly from an application mode. When updating the external stage, omit `pipelineStatus.effectiveDate` unless intentionally backfilling a timestamp.

## Voice and humanization

- Apply `voice-dna.md` and `modes/_writing.md` to candidate-facing prose. Prefer direct, specific, natural language over polished-but-generic AI phrasing.
- Remove inflated symbolism, promotional language, vague attribution, shallow analysis, repetitive transitions, excessive em dashes, and formulaic three-part constructions.
- In leadership cover letters, do not diagnose the employer or prescribe an operating model from the job description alone. Lead with curiosity about the current strengths, criticalities, and business priorities; describe changes as decisions to make after learning the real context. Keep CV recap brief because the resume already carries the detailed evidence.
- Keep cover letters declarative: do not include questions, invitations to explain the team, or requests for eligibility clarification. Express interest through the role's stated responsibilities and supported experience; handle clarification separately in application answers or recruiter discussions. Avoid repeating a story already used in a substantive application answer; use complementary evidence instead.
- Preserve the local `humanizer-zh` skill. When producing Chinese candidate-facing prose, use it as a final editing pass when available without altering facts or form constraints.

### GitHub profile voice

- Treat GitHub as Sebastian's builder surface, not as a second CV or a leadership landing page.
- Lead with Sebastian as a developer who likes making useful things. Engineering leadership is relevant context, but it should not dominate the introduction or repository selection.
- The intended impression is: **a developer and builder who also happens to be an experienced engineering leader.**
- Keep the tone relaxed, personal, technically curious, and informal. Avoid institutional CV language, executive positioning, recruiter-facing claims, and buzzwords.
- A GitHub-style tech stack with badges and a concise Impact section are welcome when they make the profile easier to scan. Impact should use concrete technical and coaching stories rather than résumé abstractions.
- Keep GitHub Impact bullets to one sentence when possible. Lead with a number or shipped result, then give only enough context to make it credible.
- Format GitHub Impact as plain single-line bullets like Cristian Conedera's profile. Do not use bold lead-ins or colon-separated labels.
- Use `---` separators between major GitHub profile sections and `###` for section headings beneath the main profile title.
- Let projects, screenshots, demos, code, and concise explanations carry the professional signal. Prefer what Sebastian is building, experimenting with, learning, and sharing over a catalogue of management achievements.
- Mention leadership lightly and factually where it adds context, without turning the profile into a management narrative.
- Include some personality and interests so the profile feels like a person rather than a branded professional document.
- Do not feature Human Review in the GitHub profile README. It belongs to an earlier stage of AI-assisted coding and is no longer representative enough for the main profile.

## Discovery and scanning

- Use the upstream 1.24 provider-based scanner and official `web/` experience for broad discovery.
- Retain the logged-in browser workflows in `scan-jobgether` and `scan-wttj`; use their deterministic helpers and cleanup rules rather than reimplementing portal logic.
- Keep `portals.yml` as the candidate's source of search filters, target companies, exclusions, and location rules.
- In `scan` mode, run `node scan.mjs` exactly once as the authoritative pass for every target resolved by its provider layer. A successful provider resolution counts as covered whether it used an ATS API, public board API/feed, Algolia, Workday, a local parser, or another built-in provider; do not reopen those companies with Playwright and do not refetch the same APIs through agent tools.
- Provider scans require network-enabled execution. If Node reports broad `TypeError: fetch failed`, DNS `ENOTFOUND`, or similar transport errors across multiple ATS providers, treat that as a sandbox/network-permission failure first: rerun the same provider pass with network access enabled before classifying boards as broken or changing `portals.yml`. Only update a provider URL after a network-enabled probe confirms that the configured endpoint is stale, migrated, or otherwise invalid.
- After the provider pass, compute the unresolved set from every enabled `tracked_companies` / `job_boards` entry for which `scan.mjs` reports no matched provider. Do not limit fallback coverage to the smaller `Agent/WebSearch handoff` list: entries marked `scan_method: playwright` and entries with a `careers_url` but no `scan_method` are unresolved browser targets too.
- Before treating an unresolved company as a recurring browser target, probe every supported ATS/provider and inspect the company's careers-page network calls when necessary. Use Chrome only to discover or debug the underlying public endpoint. When a stable unauthenticated API, feed, or board endpoint exists, pin it in `portals.yml` or add a focused provider/local-parser with tests so later scans call it directly; never make captured cookies, session tokens, or browser state part of the scanner. Keep Chrome as the recurring fallback only when no durable provider path can be verified.
- Scan each unresolved browser target through the user's Chrome extension, navigating its configured `careers_url`, following listing pagination or relevant job sections, and extracting canonical job-description URLs. Use the configured `scan_query` as a same-company fallback only after the Chrome page fails to expose usable listings. Entries explicitly marked `scan_method: websearch` remain WebSearch-first handoffs.
- Chrome is the required browser surface for unresolved portal scanning. Do not silently substitute the in-app browser or a separate Playwright profile. If Chrome or its extension is unavailable, signed out where required, or blocked, fail closed for that target and name it in the final summary under `Chrome fallback not scanned` so an incomplete run is never reported as complete.
- Also run enabled cross-portal `search_queries` whose purpose is discovering companies outside the provider-covered set. Discard every browser/search hit for a company/role already covered by the provider pass or present in scan history, the pipeline, or the application tracker. Verify the liveness and canonical URL of each genuinely new candidate before adding it.
- Do not browse any provider-covered company as a redundant second scan level, and do not treat a transient provider network error as permission for a broad Chrome rescan; report transient errors and use the existing persistent-health workflow for repeated failures.
- `scan` never invokes `scan-jobgether` or the logged-in `scan-wttj` recommendation workflow implicitly. Those remain separate, explicitly requested browser modes.
- The scan task ends after discovery, filtering, deduplication, writes to `data/pipeline.md` / `data/scan-history.tsv`, and a concise summary. It does not run `pipeline`, evaluate offers, generate CV artifacts, or apply unless the user separately requests that next mode.
