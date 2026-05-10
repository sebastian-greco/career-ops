# Mode: apply — Live Application Assistant

Interactive mode for when the candidate is filling out an application form in Chrome. It reads what is on the screen, extracts the live JD, uses the JD as the primary proof source, and generates personalized responses for each form question while syncing only selective reusable application memory into the external tracker app.

## Requirements

- **Best with Playwright in visible mode**: In visible mode, the candidate sees the browser and Claude can inspect the page.
- **Hard rule**: Do not fill, upload, click through, solve captchas, or submit the application on the candidate's behalf. The browser is read-only for `apply` mode.
- **Without Playwright**: the candidate shares a screenshot or pastes the questions manually.

## Workflow

```text
1. DETECT      → Read active Chrome tab (screenshot/URL/title)
2. IDENTIFY    → Extract company + role from the page
3. EXTRACT     → Capture the live JD / visible job details from the page
4. LOAD        → Read cv.md, article-digest.md, _profile.md, profile.yml, and matching report if it exists
5. COMPARE     → Does the role on screen match the one evaluated? If it changed → notify
6. ANALYZE     → Identify ALL visible form questions and classify what should be remembered
7. RETRIEVE    → Search prior saved answers in the external tracker app for reusable long-form examples
8. GENERATE    → For each question, generate a personalized response grounded in the live JD
9. SYNC        → Create or update the tracker app record with JD and only the few reusable answers worth keeping
10. PRESENT    → Show formatted responses for copy-paste
```

## Step 1 — Detect the job

**With Playwright/browser tools:**
- First inspect the active page.
- If there is no useful application page open, do not stop there.
- If a report or job URL is already available in the invocation context, open that page in Chrome yourself and continue from there.
- Only ask the candidate to open the page manually when no usable URL is available or the site requires a session step you cannot complete.
- Once the right page is open, take a snapshot and read title, URL, and visible content.

**Without Playwright:** Ask the candidate to:
- Share a screenshot of the form (Read tool can read images)
- Or paste the form questions as text
- Or say company + role so we can search for it

## Step 2 — Identify and search for context

1. Extract company name and role title from the page
2. Extract the live JD text from the visible job page itself
3. Read `cv.md`, `article-digest.md`, `modes/_profile.md`, and `config/profile.yml`
4. Search in `reports/` by company name (case-insensitive grep)
5. If there is a match → load the full report as secondary context only
6. If there is a Section G → use it only as supporting prior draft context, not as the primary proof source
7. If there is NO match → continue anyway; do not block answer generation just because no report exists

**Evidence priority (MANDATORY):**
1. Live JD and visible page content
2. `cv.md`
3. `article-digest.md`
4. `modes/_profile.md`
5. `config/profile.yml`
6. Matching report / Section G as secondary support only
7. `interview-prep/story-bank.md` only when a supported long-form proof point is needed

If the live page and the report differ, always prefer the live page.

## Step 3 — Detect changes in the role

If the role on screen differs from the one evaluated:
- **Notify the candidate**: "The role has changed from [X] to [Y]. Do you want me to re-evaluate or adapt the responses to the new title?"
- **If adapt**: Adjust responses to the new role without re-evaluating
- **If re-evaluate**: Execute full A-F evaluation, update report, regenerate Section G
- **Update trackers**: Change role title in the external tracker app and in the markdown tracker flow if applicable

## Step 4 — Analyze form questions

Identify ALL visible questions:
- Free text fields (cover letter, why this role, etc.)
- Dropdowns (how did you hear, work authorization, etc.)
- Yes/No (relocation, visa, etc.)
- Salary fields (range, expectation)
- Upload fields (resume, cover letter PDF)

Classify each question:
- **Short-lived / not memory-worthy** → answer it, but do NOT persist it in the tracker app
- **Substantive / reusable** → persist it in the tracker app as saved Q&A

Default to **not** persisting. Only store answers that are genuinely worth reusing later.

Exception: save salary / compensation answers by default for recordkeeping, even when they are primarily useful as an interview and negotiation reference rather than a reusable drafting answer.

Do NOT persist questions such as:
- name
- email
- phone
- location
- LinkedIn URL
- GitHub URL
- portfolio URL
- current company
- dropdown / radio / checkbox selections
- upload fields
- binary or screening questions whose answer is just a form choice
- visa / work authorization boilerplate
- generic demographic / checkbox disclosures
- years-of-experience screening prompts when they are only numeric or form-only, unless the user explicitly wants them saved

Persist substantive answers such as:
- why this role
- why this company
- AI workflow / tooling / coding assistants
- salary expectations
- leadership philosophy
- management / hiring / coaching experience narratives entered as real text responses
- payments / integrations experience
- longer role-fit narratives

`includeInAiContext` must default to `false` for saved answers. Only set it to `true` when the answer is intentionally evergreen and the user wants it reused automatically in future drafting.

## Step 5 — Retrieve prior saved answers

Before drafting a substantive long-form answer:
1. Extract the topic from the question
2. Search the external tracker API for prior saved answers using:

```bash
node sync-application-tracker.mjs search --query "<topic>"
```

3. Use the best prior examples as references only when they are relevant
4. Do not copy stale company-specific wording blindly
5. Prefer the live JD and current role context over older answers when they conflict

## Step 6 — Generate responses

For each question, generate the response following:

1. **Live JD context**: Use the actual role language visible on screen first
2. **Candidate evidence**: Use supported proof points from `cv.md`, `article-digest.md`, `_profile.md`, and `profile.yml`
3. **Previous saved answers**: If a relevant prior answer exists in the tracker app, use it as a reference and refine
4. **Report context**: Use report block B / F / Section G only as secondary support
5. **"I'm choosing you" tone**: Same auto-pipeline framework
6. **Specificity**: Reference something specific from the JD visible on screen
7. **career-ops proof point**: Include in "Additional info" if there is a field for it

For cover letters:
- If the form has a dedicated cover-letter field, always draft one
- Save the cover letter into the external tracker app `currentDraft` field only when the live form has a dedicated cover-letter field
- If the form does not expose a cover-letter field, do not store a cover letter in the tracker app

**Output format:**

```text
## Responses for [Company] — [Role]

Based on: Live JD | Report #NNN if available | Supporting evidence from cv.md / article-digest.md

---

### 1. [Exact form question]
> [Response ready for copy-paste]

### 2. [Next question]
> [Response]

...

---

Notes:
- [Any observations about the role, changes, etc.]
- [Personalization suggestions the candidate should review]
```

## Step 7 — Sync to external tracker app during drafting

During drafting, create or update the application record in the external tracker app using:

```bash
node sync-application-tracker.mjs upsert --input /tmp/apply-tracker-payload.json
```

The payload should include:
- company name
- role title
- job posting URL
- extracted live JD text
- cover letter draft only when the form explicitly asks for one
- pipeline stage (default `draft` until confirmed otherwise)
- only the few substantive saved question answers worth keeping

Upsert behavior:
- exact `jobPostingUrl` match first
- otherwise same company + same role title
- use the tracker app's default resume version

Stored fields:
- JD text → `jobDescriptionText`
- cover letter → `currentDraft` only when the live form asks for one
- substantive questions → `savedQuestionAnswers`
- application stage like `applied` / `rejected` → `pipelineStatus`

## Step 8 — Post-apply (optional)

If the candidate confirms that they submitted the application:
1. Update pipeline status in the external tracker app to `applied`
2. Queue a markdown tracker update through `batch/tracker-additions/` and merge it with `merge-tracker.mjs`
3. Update Section G of the report with the final responses
4. Suggest next step: `/career-ops contacto` for LinkedIn outreach

Never update `data/applications.md` directly from `apply`.

## Scroll handling

If the form has more questions than the visible ones:
- Ask the candidate to scroll and share another screenshot
- Or paste the remaining questions
- Process in iterations until the entire form is covered
