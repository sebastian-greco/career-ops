# Career-Ops for Codex

Read `CLAUDE.md` for all project instructions, routing, and behavioral rules. They apply equally to Codex.

Key points:
- Reuse the existing modes, scripts, templates, and tracker flow — do not create parallel logic.
- Store user-specific customization in `config/profile.yml`, `modes/_profile.md`, or `article-digest.md` — never in `modes/_shared.md`.
- `/career-ops apply-full <report-id>` is an explicit instruction to run that report's full application flow, including filling fields, uploading the reviewed RxResume PDF, and submitting the application when all gates pass.
- Never guess an unknown material answer. Pause for the user when a CAPTCHA, authentication step, missing factual answer, legal attestation, or reviewer escalation requires input, then resume from the same step.
- Never submit from scan, evaluation, pipeline, the read-only `apply` mode, or scheduled discovery alone. Submission authority is scoped to an explicit `apply-full` invocation or a separately configured application policy.

For Codex-specific setup, see `docs/CODEX.md`.
