# Mode: apply-full — Full Reviewed Application

Manually triggered, end-to-end execution for one evaluated role. The canonical invocation is `/career-ops apply-full <report-id>`.

This mode is additive. It does not replace or change `apply` or `json-cv`:
- `modes/apply.md` remains the read-only live application assistant for extracting the JD/questions, drafting answers, and syncing selective application memory.
- `modes/json-cv.md` remains the sole definition of how the RxResume JSON is analyzed and tailored.
- `apply-full` orchestrates those existing modes, adds RxResume PDF export/verification and an independent review gate, then fills and submits the external application.

## Authority and pause rules

- `/career-ops apply-full <report-id>` is explicit authority to fill, upload, navigate, and submit that one application after every gate passes.
- Scans, evaluations, pipeline runs, `apply`, and scheduled discovery do not authorize submission.
- Never guess a missing factual answer, identity value, work-authorization answer, compensation answer, legal attestation, or other material field. Pause, ask the user, preserve state, and resume.
- Never solve or bypass a CAPTCHA. Ask the user to complete it in the same Chrome tab, then resume.
- If Chrome control is unavailable, complete preparation and review but pause before form execution.

## Required context

Load:
- `modes/_shared.md`
- `modes/apply.md`
- `modes/json-cv.md`
- resolved report and saved JD/skills artifacts
- `cv.md`
- `article-digest.md`
- `modes/_profile.md`
- `config/profile.yml`
- selected complete base RxResume JSON
- relevant story-bank evidence only when the existing `json-cv` rules permit it

## Workflow

```text
1. RESOLVE   → Report, URL, tracker record, saved JD, and prior skills scan
2. VERIFY    → Open the live role/application in Chrome and confirm it is active
3. EXTRACT   → Exact current JD, every form question, option, and character limit
4. ANALYZE   → Run the existing json-cv coverage analysis against the exact JD
5. TAILOR    → Create the RxResume JSON exactly as modes/json-cv.md defines
6. EXPORT    → Validate, sync through local RxResume OpenAPI, and export PDF
7. PDF QA    → Require one page, extracted text, and clean rendered preview
8. ANSWERS   → Draft Q&A using modes/apply.md and the same JD coverage map
9. REVIEW    → Fresh subagent audits evidence, JSON, PDF, and complete form package
10. REVISE   → Fix every finding and repeat review, up to three passes
11. FILL     → Populate the ATS and upload only reviewed documents
12. HANDOFF  → Pause/resume for CAPTCHA, authentication, or missing material facts
13. SUBMIT   → Compare populated form with reviewed package, then submit
14. CONFIRM  → Require visible success confirmation or application id
15. SYNC     → Mark external and Markdown trackers Applied
```

## 1. Resolve and inspect the live application

Resolve the report id/path first and use the report's `**URL:**`. Follow `modes/apply.md` for:
- live JD extraction and evidence priority
- role-change detection
- complete form-question discovery
- saved-answer retrieval
- Q&A persistence classification
- external tracker draft upsert

Unlike `apply`, scroll and navigate non-submitting application steps directly in Chrome until all questions and constraints are known. Do not fill yet.

If the live role materially differs from the report, is expired, or exposes a new blocker, pause before tailoring or submitting.

## 2. RxResume JSON — reuse existing behavior

Run `modes/json-cv.md` as written. `apply-full` must not introduce a second tailoring method or relax its truth, chronology, base-copy, content-budget, or evidence rules.

The explicit `apply-full` invocation authorizes the concrete, supported tailoring changes that `json-cv` proposes for this application. Still pause wherever `json-cv` expressly requires new user evidence or approval, especially unsupported additions or story-bank material not already approved for resume use.

The hard-skill and soft-skill coverage scan produced by `json-cv` becomes a shared artifact for the Q&A stage. Do not change the general `json-cv` instructions to accomplish this orchestration.

## 3. Sync and export through local RxResume

The application PDF must come from the local RxResume instance. Do not use Chrome for RxResume and do not substitute the HTML, LaTeX, Canva, or `generate-pdf.mjs` paths.

After the tailored JSON passes its existing validation:

```bash
npm run resume:sync -- <report-id-or-report-path> --export-pdf
```

The command must:
1. list the user's resumes through the authenticated local OpenAPI
2. create the matching resume when absent or update it with the complete validated JSON
3. call `GET /api/openapi/resumes/{id}/pdf`
4. download the returned PDF beside the JSON with the same report-numbered basename

If the local API or export fails, leave the application in draft and report the exact error.

## 4. One-page PDF gate

Run:

```bash
npm run resume:verify-pdf -- <pdf-path> --expected-text "<candidate-name>"
```

Require:
- exactly one page
- selectable, substantial text with expected identity/sections
- unchanged experience chronology
- no clipping, overlap, broken links, missing bullets, or unreadably small text
- rendered content consistent with the validated JSON

The deterministic verifier emits `textPath` and `previewPath`. Both must go to the independent reviewer. If the PDF fails, revise through the existing `json-cv` content-budget rules, re-sync, re-export, and re-check.

## 5. Q&A from the same coverage analysis

Use `modes/apply.md` for answer generation, voice, evidence order, prior-answer retrieval, cover-letter rules, and tracker persistence.

Also create this shared map from the existing coverage scan:

`JD priority → exact JD wording → supported evidence → resume location → relevant form questions`

Use it to prioritize consistent strengths across the resume and answers, expose genuine gaps directly, and prevent answers from adding claims that the evidence does not support. Answers should complement rather than repeat the resume summary.

## 6. Independent review gate

Launch a fresh reviewer subagent after the JSON, PDF, and complete answer set exist. The reviewer must receive:
- exact live JD and URL
- evaluation report and coverage scan
- selected base JSON, tailored JSON, and structured diff
- exported PDF, rendered PNG, and extracted text
- `cv.md`, `article-digest.md`, relevant profile sections, and evidence actually used
- every exact form question, constraint, selected option, and proposed answer
- identity, salary, location, and work-authorization values used

Required result:

```json
{
  "unsupportedClaims": [],
  "misleadingImplications": [],
  "evidenceMismatches": [],
  "jdCoverageGaps": [],
  "aiOrMadeUpPhrasing": [],
  "crossApplicationContamination": [],
  "resumeAnswerContradictions": [],
  "formConstraintFailures": [],
  "pdfQualityFailures": [],
  "decision": "PASS | REVISE | HUMAN_REVIEW"
}
```

Every finding must identify the affected text/artifact and source evidence. Fix all `REVISE` findings and launch a fresh review. After three unsuccessful passes, pause as `HUMAN_REVIEW`.

## 7. Fill, submit, and confirm

Only after reviewer `PASS`:
1. Fill identity fields from explicit profile data.
2. Fill screening choices only from explicit facts or saved answers.
3. Fill long-form answers exactly from the reviewed set, respecting live limits.
4. Upload the reviewed RxResume PDF and a reviewed cover letter only when requested.
5. Navigate every application step and re-read each populated page.
6. If a new material question appears, add it to the review package and review it before continuing.
7. Compare every material populated field and uploaded filename with the reviewed package.
8. Click Submit/Send/Apply only after that comparison passes.

Do not treat the click as proof. Require a visible confirmation page/message or application id.

## 8. Tracker synchronization

After confirmed submission:
1. Set the external tracker stage to `applied`, normally omitting `effectiveDate` so the backend records the current timestamp.
2. Queue the Markdown tracker change through `batch/tracker-additions/` and run `merge-tracker.mjs`.
3. Update the report with final answers, JSON/PDF paths, reviewer decision, submission timestamp, and confirmation evidence.

If confirmation is ambiguous, leave the tracker in `draft`. Never add a row directly to `data/applications.md`.
