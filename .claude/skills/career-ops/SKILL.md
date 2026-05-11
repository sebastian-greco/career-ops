---
name: career-ops
description: AI job search command center -- evaluate offers, generate CVs, scan portals, track applications
user_invocable: true
args: mode
argument-hint: "[scan | scan-jobgether | deep | pdf | json-cv | oferta | ofertas | apply | batch | tracker | pipeline | contacto | training | project | interview-prep | update]"
---

# career-ops -- Router

## Mode Routing

Determine the mode from `{{mode}}`:

| Input | Mode |
|-------|------|
| (empty / no args) | `discovery` -- Show command menu |
| JD text or URL (no sub-command) | **`auto-pipeline`** |
| `oferta` | `oferta` |
| `ofertas` | `ofertas` |
| `contacto` | `contacto` |
| `deep` | `deep` |
| `pdf` | `pdf` |
| `json-cv` | `json-cv` |
| `training` | `training` |
| `project` | `project` |
| `tracker` | `tracker` |
| `pipeline` | `pipeline` |
| `apply` | `apply` |
| `scan` | `scan` |
| `scan-jobgether` | `scan-jobgether` |
| `batch` | `batch` |
| `patterns` | `patterns` |
| `followup` | `followup` |

**Auto-pipeline detection:** If `{{mode}}` is not a known sub-command AND contains JD text (keywords: "responsibilities", "requirements", "qualifications", "about the role", "we're looking for", company name + role) or a URL to a JD, execute `auto-pipeline`.

If `{{mode}}` is not a sub-command AND doesn't look like a JD, show discovery.

---

## Discovery Mode (no arguments)

Show this menu:

```
career-ops -- Command Center

Available commands:
  /career-ops {JD}      → AUTO-PIPELINE: evaluate + report + PDF + tracker (paste text or URL)
  /career-ops pipeline  → Process pending URLs from inbox (data/pipeline.md)
  /career-ops oferta    → Evaluation only A-F (no auto PDF)
  /career-ops ofertas   → Compare and rank multiple offers
  /career-ops contacto  → LinkedIn power move: find contacts + draft message
  /career-ops deep      → Deep research prompt about company
  /career-ops pdf       → PDF only, ATS-optimized CV
  /career-ops json-cv   → Tailor RxResume JSON interactively from a report, URL, or role name
  /career-ops training  → Evaluate course/cert against North Star
  /career-ops project   → Evaluate portfolio project idea
  /career-ops tracker   → Application status overview
  /career-ops apply     → Live application assistant (reads form + generates answers)
  /career-ops scan      → Scan portals and discover new offers
  /career-ops scan-jobgether → Scan first 10 Jobgether cards into pipeline
  /career-ops batch     → Batch processing with parallel workers
  /career-ops patterns  → Analyze rejection patterns and improve targeting
  /career-ops followup  → Follow-up cadence tracker: flag overdue, generate drafts

Inbox: add URLs to data/pipeline.md → /career-ops pipeline
Or paste a JD directly to run the full pipeline.
```

---

## Context Loading by Mode

After determining the mode, load the necessary files before executing:

### Modes that require `_shared.md` + their mode file:
Read `modes/_shared.md` + `modes/{mode}.md`

Applies to: `auto-pipeline`, `oferta`, `ofertas`, `pdf`, `json-cv`, `contacto`, `apply`, `pipeline`, `scan`, `scan-jobgether`, `batch`

### Standalone modes (only their mode file):
Read `modes/{mode}.md`

Applies to: `tracker`, `deep`, `training`, `project`, `patterns`, `followup`

### Resume chronology guardrail

For any resume-tailoring mode (`json-cv`, `pdf`, `latex`, and resume generation inside other flows):

- Keep professional experience entries in reverse chronological order at all times.
- Keep nested roles within the same company in their real chronological order.
- Do not move an older company or role above a newer one just because it matches the JD better.
- Allowed reordering is limited to bullets within a role, skill groups, and other non-chronology structural elements.
- If stronger older evidence matters, surface it by reordering bullets within that role or lightly rewriting supported wording, not by reordering the job history.

### Modes delegated to subagent:
For `scan`, `scan-jobgether`, `apply` (with Playwright), and `pipeline` (3+ URLs): launch as Agent with the content of `_shared.md` + `modes/{mode}.md` injected into the subagent prompt.

```
Agent(
  subagent_type="general",
  prompt="[content of modes/_shared.md]\n\n[content of modes/{mode}.md]\n\n[invocation-specific data]",
  description="career-ops {mode}"
)
```

### Mode-specific execution notes

#### `apply`

- This mode is browser-assisted by default.
- The browser is read-only in this mode: inspect the live JD and visible questions, but do not fill fields, upload files, solve captchas, click through the form, or submit anything on the user's behalf.
- Do not stop just because the current Chrome tab is blank or unrelated.
- If the invocation includes a report id or report path, read the report and use its `**URL:**` as the default page to open in Chrome.
- If the invocation includes a direct job URL, open that URL in Chrome yourself.
- Only ask the user to open or paste the form manually when there is no usable URL available, the site blocks access, or the application flow requires an authenticated session you cannot continue through.
- After opening the page, extract the full live JD and visible form content first.
- In this mode, the live JD is the primary proof source. Matching reports are supporting context only.
- If the live page reveals a hard mismatch and the user confirms it is a blocker, stop there. Do not continue drafting persuasive answers for that application.
- Ground answers in the following order: live JD, `cv.md`, `article-digest.md`, `modes/_profile.md`, `config/profile.yml`, then matching reports.
- During drafting, create or update the external application tracker record through `sync-application-tracker.mjs` using `APPLICATION_TRACKER_URL`.
- Save the full extracted live JD to the tracker app `jobDescriptionText` field verbatim, as close to copy-paste from the live page as possible. Do not summarize, compress, or paraphrase it.
- Save a cover letter draft to the tracker app `currentDraft` field only when the live application explicitly asks for a cover letter.
- Save only genuinely reusable substantive answers to the tracker app. Default to not saving question/answer pairs, with one explicit exception: save salary / compensation answers for recordkeeping.
- Text-entry management / hiring / coaching experience answers are also worth saving when they are substantive narrative responses rather than a simple numeric screen.
- Substantive `Additional Information` / `Anything else you'd like us to know?` responses are also worth saving when they contain role-specific motivation, culture fit, or useful interview context rather than boilerplate.
- Do not store identity / boilerplate questions like name, location, LinkedIn, GitHub, current company, uploads, generic work-authorization fields, simple radio/dropdown screening questions, or other short-lived form-only answers.
- Saved question answers must default to `includeInAiContext: false`. Only mark them as AI context when the user explicitly wants that answer reused automatically later.
- Before drafting long-form answers, search prior saved answers in the tracker app and reuse them carefully when relevant.
- Keep the markdown tracker in sync too, but do not edit `data/applications.md` directly from `apply`; use the tracker-additions flow.
- Generate answers without submitting the application.

#### `scan-jobgether`

- This mode is a browser-driven workflow, not a pure shell scan.
- Prefer the already logged-in Jobgether Chrome tab at `jobgether.com/home`.
- Use browser tooling to read the first 10 visible cards only.
- For each card, open the Jobgether offer page and extract the external `APPLY` URL from the offer detail page.
- Then call the deterministic helper:

```bash
node scan-jobgether.mjs --input /tmp/jobgether-batch.json
```

- The helper returns structured per-item results including `status`, `normalizedUrl`, and `cleanupAction`.
- Use that output to decide the Jobgether cleanup click:
  - `skipped_dup` → `I'm Interested`
  - `added` + plausible fit → `I'm Interested`
  - `added` + obvious non-fit → `Not Interested`
  - `skipped_invalid` → `Leave Alone`
- Report the batch summary after processing.

Execute the instructions from the loaded mode file.
