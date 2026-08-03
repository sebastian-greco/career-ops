# Mode: scan-wttj — Low-token Welcome to the Jungle scan

Scan the user's Welcome to the Jungle recommendations through the logged-in Codex Chrome extension tab, keep only relevant roles, and add employer-hosted job-description URLs to the normal Career-Ops pipeline.

## Non-negotiable rules

- Never apply through Welcome to the Jungle.
- Never click `Apply with your profile` or submit an application.
- Never print, copy, persist, or pass browser cookies or access tokens.
- Never open a separate Playwright/MCP Chrome profile for authentication.
- Never add a Welcome to the Jungle job URL to `data/pipeline.md`.
- Add only the external employer/ATS job-description URL from `originalUrl`.
- Reuse `data/pipeline.md`, `data/scan-history.tsv`, `data/applications.md`, `portals.yml`, and the shared scan utilities.

## Browser source

- Use the existing logged-in Chrome extension tab at `https://app.welcometothejungle.com/`.
- If that tab is signed out, ask the user to sign in there and tell you when it is ready.
- Do not use `scan-wttj.mjs` to launch or authenticate a browser.
- Do not attempt to export the extension session into another browser.

## Extraction workflow

1. Open `https://app.welcometothejungle.com/jobs` in the existing extension tab.
2. Read the visible job's company, title, and WTTJ job URL.
3. Open the visible `Apply` modal only; do not click either application option.
4. Extract the secondary `"{Company}'s website"` URL and close the modal.
5. Pass the extracted item to the deterministic helper with `--dry-run` and read `cleanupAction`.
6. Apply exactly that cleanup action to advance the deck:
   - `Save`: click the visible Save control. Use for relevant new roles, duplicates, and relevant WTTJ-only roles.
   - `Not Interested`: click the visible negative/reject control. Use only for obvious non-fits.
   - `Leave Alone`: do not click anything; stop rather than advancing blindly.
7. Wait for the card to disappear and verify the next job has a different WTTJ URL.
8. Repeat until 10 jobs are processed or the deck/cleanup action blocks safe progress.
9. Run the deterministic helper once with the complete batch and without `--dry-run` to write results.

Never click `Apply with your profile`. Saving is a cleanup/bookmark action, not an application.

## Deterministic handoff

Run:

```bash
node scan-wttj.mjs --input /tmp/wttj-batch.json
```

The helper applies the Career-Ops title/company filters, normalizes employer URLs, deduplicates, and writes relevant new offers.

Useful diagnostics:

```bash
node scan-wttj.mjs --input /tmp/wttj-batch.json --dry-run
```

## Result handling

Statuses:

- `added`: relevant external job URL added to `data/pipeline.md`
- `skipped_dup`: already present by normalized URL or company + role
- `skipped_non_fit`: rejected by existing Career-Ops filters
- `skipped_no_external_url`: WTTJ-only application; do not add it
- `skipped_invalid`: missing company or title

Cleanup actions:

- `Save`: `added`, `skipped_dup`, or relevant `skipped_no_external_url`
- `Not Interested`: `skipped_non_fit`
- `Leave Alone`: `skipped_invalid`

Report the counts, roles added, and how many cards were saved, rejected, or left alone. Remind the user to run `/career-ops pipeline` when new offers were added.

## Future API fast path

WTTJ uses `https://api.exp.welcometothejungle.com/graphql`, and its recommendation data includes `originalUrl`. Use a direct batch query only when the selected browser surface provides a supported authenticated request-replay API that keeps credentials opaque. The Codex Chrome extension does not currently provide that capability. Do not export cookies as a workaround.

Input format:

```json
{
  "items": [
    {
      "company": "RevenueCat",
      "title": "Engineering Manager",
      "externalUrl": "https://jobs.ashbyhq.com/revenuecat/...",
      "wttjJobUrl": "https://app.welcometothejungle.com/jobs/v9uPC3Qy"
    }
  ]
}
```
