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

Preferred source of truth is an existing report whenever possible.

## Required context

Read before tailoring:
- `cv.md`
- `config/profile.yml`
- `modes/_profile.md`
- `interview-prep/story-bank.md`
- the resolved report, if any
- the selected base JSON template

## Template selection

Choose between:
- leadership base JSON
- IC base JSON

Follow the template policy in `_profile.md`.

If the choice is ambiguous, ask the user.

## Tailoring philosophy

Do not regenerate the resume from scratch.

Start from the selected base template and ask:
1. What in this resume would clearly get Sebastian discarded for this role?
2. What existing evidence should move earlier because a recruiter will likely skim it?
3. What is already good enough and should stay untouched?

Default behavior:
- summary: leave mostly intact
- experience: reorder first
- skills: reorder sections first
- projects: for leadership templates, leave untouched unless explicitly discussed

## Review-first interaction model

Do NOT start by asking the user abstract preference questions.

Instead, follow this order:
1. Review the resolved role/report against the selected base JSON template
2. Decide whether any change is actually needed
3. If no meaningful change is needed, say so and keep the resume as-is
4. If changes are needed, present a concise proposed change list first
5. Only then ask for approval when the proposal includes additions, removals, or material rewrites

The proposal shown to the user should be concrete, for example:
- which bullets would move up or down
- which sentence would be lightly rewritten
- which new evidence from `interview-prep/story-bank.md` might be added
- which content, if any, would be removed and why

The user should never be asked to decide in the abstract without seeing the proposed modifications first.

## Mandatory interaction rules

Ask the user before:
- removing any bullet, project, or section content
- adding any new bullet
- adding evidence from `interview-prep/story-bank.md`
- materially rewriting content beyond light summary tweaks and reordering

The only changes that may be done without asking are:
- reordering bullets
- reordering sections or skill groups
- very light summary adjustments when clearly helpful

Even in those cases, first explain the proposed changes if they are not obvious.

## Output

Write the tailored JSON to `output/` using the existing filename style.

After writing it:
1. Run `npm run resume:validate -- <output-file>`
2. Report back with a concise summary:
   - what moved
   - what was lightly rewritten
   - what was proposed but intentionally not changed
   - what was left intact
   - what still may need user review

## Important constraints

- Never invent new experience, metrics, or tools
- Never keyword-stuff skills into the wrong categories
- Never remove content silently
- Prefer preserving speed and trust over forcing alignment
