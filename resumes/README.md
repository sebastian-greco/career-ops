# Resume Templates

This directory holds local RxResume base templates used to generate tailored JSON resume artifacts.

Local files expected here:
- `leadership-base.json` — leadership-oriented base resume for Director / Head / Senior Engineering Manager / Engineering Manager roles
- `ic-base.json` — hands-on IC-oriented base resume for Staff / Principal / Senior Backend / Senior Software Engineer roles

These JSON files are intentionally gitignored because they are personal resume assets.

Current local mapping:
- `leadership-base.json` was initialized from `cv.json`
- `ic-base.json` was initialized from `output/055-phantom-senior-backend-money.json`

Generation policy lives in:
- `config/profile.yml` under `resume`
- `modes/_profile.md` under Resume Artifact Preferences and Resume Template Strategy
