# Mode: json-cv — Tailored RxResume JSON

## Goal

Create a tailored RxResume JSON resume artifact for a specific role using an existing base JSON template.

The tailoring must be:
- agent-driven, not deterministic
- minimal-diff by default
- review-first, then interactive only when there is a concrete significant change to approve
- validated for JSON and RxResume schema safety after edits

## Accepted input

The mode argument is `<job-or-report>` and can be:
- report id, e.g. `059`
- report file path, e.g. `reports/059-gitlab-2026-04-11.md`
- job URL
- company + role text, e.g. `DuckDuckGo Senior Backend Engineer`
- empty, in which case ask the user to choose interactively

## Resolution order

1. If the input is only digits, treat it as a report id and resolve `reports/<id>-*.md`
2. If the input looks like a local path:
   - `.md` → report path
   - `.json` → existing JSON resume to refine
3. If the input starts with `http://` or `https://`:
   - try to find a matching existing report first
   - if none exists, ask the user whether to evaluate first or use the JD directly
4. Otherwise, treat it as a fuzzy company/role query and search in this order:
   - `reports/`
   - `data/applications.md`
   - `data/pipeline.md`
5. If multiple plausible matches exist, ask the user to choose

Preferred source of truth for tailoring is the exact job description.

Use an existing report to:
- resolve the job URL
- recover prior artifact paths
- reuse fit/context notes
- avoid redoing obvious lookup work

Do not use the report as the primary description of the role when the live JD is available.

If the resolved report includes a live job URL, open that listing and extract the exact current JD before tailoring.

Do not rely only on an older report snapshot when the live JD is still available.

If both a live JD and a report are available:
- treat the live JD as primary for requirements, scope, wording, and skill emphasis
- treat the report as secondary context only

If the live JD is unavailable:
- fall back to the resolved report
- say clearly that tailoring is being done from report text rather than the live listing

## Required context

Read before tailoring:
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`
- `article-digest.md`
- `interview-prep/story-bank.md`
- the exact current JD text from the live listing, when the URL is available
- the resolved report, if any
- the selected base JSON template

## Template selection

Choose between:
- leadership base JSON
- IC base JSON

Follow the template policy in `_profile.md`.

For leadership roles:
- default application base is `resumes/leadership-base.json` (one page)

If the choice is ambiguous, ask the user.

## Base File Handling -- MANDATORY

The output resume must start as a direct file copy of the selected base JSON.

Required workflow:
1. Resolve the output filename in `output/`
2. Copy the selected base JSON file to that output path
3. Modify the copied output file in place
4. Validate the final output file
5. Sync that exact validated file to RxResume if enabled

Do not reconstruct the resume JSON from scratch.

Do not rebuild the full JSON document from snippets, summaries, or partial file reads.

Do not hand-transcribe long embedded strings such as:
- `metadata.css.value`
- large HTML description fields
- layout metadata blocks

This matters because the base JSON contains long single-line strings and nested metadata that are easy to truncate or corrupt when manually recreated.

Safe editing rule:
- treat the selected base JSON as the source document
- preserve every field by default
- only change the specific keys needed for tailoring
- if a field is unchanged, it should remain byte-for-byte inherited from the copied base unless a formatter or validator intentionally normalizes it

Unsafe workflow to avoid:
- reading the base JSON through a truncated view
- recreating the whole file manually
- pasting back a partial `metadata.css.value`
- omitting layout or typography fields because they looked unrelated to tailoring

If the existing output artifact already exists and is the one paired to the report, prefer editing that artifact in place rather than creating a fresh manual reconstruction.

## Skill Coverage Scan

Before proposing any tailoring changes, run a skill coverage scan against:
- the exact live JD text
- the selected base JSON template
- the resolved report as supporting context

Use a dedicated agent/subagent for this scan when that capability is available.

The scan should return a compact report with two tables:
1. hard skills comparison
2. soft skills / leadership signals comparison

Recommended columns:
- Skill
- Resume
- Job Description
- Notes

Coverage rules:
- treat the selected base JSON template as the resume being scanned, not `cv.md`
- hidden sections in the JSON should not count as present in the rendered resume
- distinguish explicit matches from adjacent or partial matches
- prefer concrete, role-relevant skills over generic word overlap
- do not treat missing skills as permission to invent them

Hard-skill scan examples:
- languages, frameworks, infra, architecture patterns, APIs, databases, security practices, payments terms, AI tooling

Soft-skill scan examples:
- mentoring, coaching, ownership, communication, cross-functional collaboration, decision-making, stakeholder management, pace, adaptability, technical leadership

Use the scan report to answer:
1. Which 3-5 hard skills already align well and should be surfaced earlier?
2. Which missing hard skills are true risks versus acceptable non-matches?
3. Which soft-skill expectations are already evidenced and where?
4. Which wording in the base resume is too generic for this JD?

This scan is an input to tailoring, not a separate rewriting pass.

## Coverage-Driven Surfacing Rule

The coverage scan must actively drive the tailoring outcome.

If the JD strongly emphasizes a dimension that is already truthfully supported by `cv.md`, `article-digest.md`, `interview-prep/story-bank.md`, or the selected base resume, but that dimension is underexposed in the current base template, the default behavior is to surface it more clearly.

Common examples:
- full-stack or frontend/product-heavy leadership roles
- product-minded engineering management
- async/written collaboration
- coaching and people development
- hands-on AI/LLM product delivery

When that happens, prefer this order of changes:
1. headline under the candidate name
2. summary language
3. skills grouping/order
4. bullet order within the most relevant existing role
5. swapping a weaker bullet for a stronger supported bullet from existing evidence sources

Do not leave a strong supported fit buried just because the base template is leadership-oriented.

## JD-First Tailoring Rule

Tailor to the live JD, not to the report summary.

That means:
- match against the actual wording, scope, and requirements shown in the listing
- use the report only to preserve useful prior context such as fit score, recommendation, location checks, or known risks
- if the report and the live JD diverge, prefer the live JD and note the mismatch briefly

## Tailoring philosophy

Do not regenerate the resume from scratch.

Start from the selected base template and ask:
1. What in this resume would clearly get Sebastian discarded for this role?
2. What existing evidence should move earlier because a recruiter will likely skim it?
3. What is already good enough and should stay untouched?

Default behavior:
- summary: leave mostly intact, unless the coverage scan shows an important supported fit that is underexposed
- experience: reorder bullets within each role first; keep jobs and role history in reverse chronological order
- skills: reorder sections first, and retune visible keywords when the JD emphasizes already-supported strengths that are currently buried
- projects: for leadership templates, leave untouched unless explicitly discussed

For leadership roles with strong hands-on/full-stack/product expectations:
- keep the leadership base template by default
- do not flatten the resume into an IC resume
- do expose supported hands-on/full-stack/product signals earlier and more explicitly when the JD makes them important

One-page application rule for leadership resumes:
- Tailored JSON resumes for real applications should remain one-page oriented by default
- Use the one-page base as the output template
- Add only the most relevant supported evidence for the JD
- If stronger evidence from `cv.md`, `article-digest.md`, or `interview-prep/story-bank.md` is more relevant than the current bullet set, propose swapping it in
- Avoid duplicating the same idea across summary, skills, and bullets unless the duplication clearly helps match the JD
- Prefer precise evidence over broad keyword coverage
- Treat layout space as fixed: total text should stay flat or shrink
- Never increase the total number of bullets in the one-page leadership resume
- If wording grows in one place, shorten or replace content elsewhere to keep the resume balanced and one-page safe
- Prefer replacing weaker content over appending more content

## Review-first interaction model

Do NOT start by asking the user abstract preference questions.

Instead, follow this order:
1. Review the resolved role/report against the selected base JSON template
2. Run the hard-skill and soft-skill coverage scan against the live JD and selected base template
3. Decide whether any change is actually needed
4. If no meaningful change is needed, say so and keep the resume as-is
5. If changes are needed, present a concise proposed change list first
6. Only then ask for approval when the proposal includes additions, removals, or material rewrites

The proposal shown to the user should be concrete, for example:
- which supported JD-critical signals are currently underexposed in the base template
- which bullets would move up or down
- which sentence would be lightly rewritten
- which headline or summary phrasing would change to surface a supported fit more clearly
- which new evidence from `interview-prep/story-bank.md` might be added
- which evidence from `article-digest.md`, `cv.md`, or `interview-prep/story-bank.md` might replace a weaker current bullet
- which content, if any, would be removed and why
- how the proposed changes keep the one-page text and bullet budget in balance
- which hard-skill gaps are intentionally left unmatched because they are unsupported or not worth forcing
- which soft-skill expectations are already covered well enough without adding text

The user should never be asked to decide in the abstract without seeing the proposed modifications first.

## Mandatory interaction rules

Ask the user before:
- removing any bullet, project, or section content
- adding any new bullet
- adding evidence from `interview-prep/story-bank.md`
- materially rewriting content beyond light summary tweaks and reordering

The only changes that may be done without asking are:
- reordering bullets within a role
- reordering sections or skill groups
- very light summary adjustments when clearly helpful
- headline adjustments that only surface already-supported role fit more accurately
- swapping visible skill keywords to better reflect already-supported JD-critical strengths

Even in those cases, first explain the proposed changes if they are not obvious.

## Experience chronology rule

Professional experience chronology is mandatory:
- keep company/job entries in reverse chronological order
- keep nested roles within a company in their real chronological sequence
- do not move an older role or company above a newer one to improve JD relevance

If older evidence is stronger for the target role, surface it by reordering bullets inside that role or lightly tightening supported wording.

## Output

Write the tailored JSON to `output/` using the existing filename style.

Naming rule for JSON artifacts:
- Prefix the filename with the report number when a resolved report exists

Write rule:
- The file written to `output/` must be created by copying the selected base JSON first, then applying minimal edits to that copied file
- Never write a fresh handcrafted full JSON artifact when tailoring from a base template

RxResume sync rule:
- After writing and validating the tailored JSON, sync it to local RxResume by default when `RX_RESUME_URL` and `RX_RESUME_KEY` are configured
- Skip the sync only when the user explicitly asks for local-only output or when the RxResume environment is not configured
- Pair the resolved report with its generated JSON artifact and run `npm run resume:sync -- <report-id-or-report-path>`
- The sync must create the resume if it does not exist yet, or update it if it already exists
- Prefer the human-readable RxResume title format `Sebastian Greco - <Company>`
- Append ` - <Role>` only when multiple roles exist for the same company

After writing it:
1. Run `npm run resume:validate -- <output-file>`
2. If RxResume sync is enabled, run `npm run resume:sync -- <report-id-or-report-path>`
3. Report back with a concise summary:
   - what the hard-skill scan said
   - what the soft-skill scan said
   - what moved
   - what was lightly rewritten
   - what was proposed but intentionally not changed
   - what was left intact
   - what still may need user review
   - whether RxResume was created or updated, or why sync was skipped

## Important constraints

- Never invent new experience, metrics, or tools
- Never invent new experience, metrics, tools, projects, or JD-specific claims
- Never keyword-stuff skills into the wrong categories
- Never let a JD-critical but already-supported strength remain buried just because the base template phrases the profile too generically
- Never remove content silently
- Never treat `article-digest.md` or `story-bank.md` as permission to add unsupported content without user approval
- Never let one-page leadership tailoring grow into a larger resume by accumulation
- Never reorder professional experience entries out of chronological order
- Prefer preserving speed and trust over forcing alignment
