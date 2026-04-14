---
description: Tailor an RxResume JSON resume interactively from a report, URL, or role name
---

Create a tailored RxResume JSON resume artifact using career-ops json-cv mode.

Accepted inputs for `<job-or-report>`:
- report id like `059`
- report path like `reports/059-gitlab-2026-04-11.md`
- job URL
- company + role text

Load the career-ops skill:
```
skill({ name: "career-ops" })
```
