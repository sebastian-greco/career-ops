# Shared Evaluation Schema -- Structured Output Contract

Every final evaluation should be representable as JSON with this shape.

```json
{
  "company": "Company name",
  "role": "Role title",
  "archetype": "Archetype string",
  "domain": "Domain string",
  "remoteModel": "Remote / hybrid / onsite summary",
  "legitimacy": "High Confidence | Proceed with Caution | Suspicious",
  "summary": "One-sentence TL;DR",
  "strengths": ["evidence-backed overlap 1", "overlap 2"],
  "concerns": ["real risk 1", "real risk 2"],
  "hardSkills": [
    {
      "skill": "Platform / backend systems",
      "evidence": "cv.md:18-20, cv.md:44-46",
      "jobDescription": "Platform, backend, infrastructure, or foundations scope",
      "notes": "Why this is a fit or gap"
    }
  ],
  "softSkills": [
    {
      "skill": "Cross-functional execution",
      "evidence": "cv.md:17, cv.md:42-46",
      "jobDescription": "Partner across product, platform, and business",
      "notes": "Why this matters"
    }
  ],
  "fitNotes": {
    "cvMatch": "Why this score",
    "northStar": "Why this score",
    "comp": "Why this score",
    "culture": "Why this score",
    "redFlags": "Why this score"
  },
  "legitimacySignals": [
    {
      "signal": "Signal name",
      "finding": "Observed fact",
      "weight": "Positive | Neutral | Concerning"
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "scores": {
    "cvMatch": 4.2,
    "northStar": 3.8,
    "comp": 4.0,
    "culture": 3.6,
    "redFlags": 2.9,
    "global": 3.8
  },
  "recommendation": "APPLY | CONSIDER | SKIP",
  "note": "Short tracker-ready note prefixed with APPLY / CONSIDER / SKIP"
}
```

## Rules

- Scores are numeric from `1.0` to `5.0`.
- `global` should follow the shared weighted formula from `modes/_evaluation-rubric.md`.
- `strengths` and `concerns` should be concise, specific, and evidence-backed.
- `hardSkills` and `softSkills` should be short reusable rows for the skill coverage artifact.
- `note` should be one line and usable in the markdown tracker.
- If a field is uncertain, prefer a conservative value and explain the uncertainty in `fitNotes` or `concerns`.
