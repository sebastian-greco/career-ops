# Resume Templates

This directory holds local RxResume base templates used to generate tailored JSON resume artifacts.

Local files expected here:
- `leadership-base.json` — one-page leadership-oriented application base for Director / Head / Senior Engineering Manager / Engineering Manager roles
- `ic-base.json` — hands-on IC-oriented base resume for Staff / Principal / Senior Backend / Senior Software Engineer roles

Optional local file:
- `leadership-master-base.json` — fuller leadership working draft kept for manual reference; normal tailoring should rely on `cv.md` plus the selected base template

These JSON files are local resume assets that can be versioned in your fork.

Current local mapping:
- `leadership-base.json` is the default one-page application resume for leadership roles
- `ic-base.json` is the default IC resume for selective Staff / Principal / Senior Backend tailoring

Generation policy lives in:
- `config/profile.yml` under `resume`
- `modes/_profile.md` under Resume Artifact Preferences and Resume Template Strategy
