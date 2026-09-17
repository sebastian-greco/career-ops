# LinkedIn job-alert checkpoint

The checkpoint lives at `data/linkedin-job-alerts-state.json`, which is a
user-layer file. It records the last Gmail alert message that was successfully
parsed and written, not merely the last message opened in the browser.

## Schema

```json
{
  "schema_version": 1,
  "sender": "jobalerts-noreply@linkedin.com",
  "timezone": "Europe/Rome",
  "overlap_days": 0,
  "last_successful_message_id": "gmail-message-id",
  "last_successful_message_at": "2026-09-06T18:42:00+02:00",
  "checkpoint_precision": "timestamp",
  "last_run_completed_at": "2026-09-07T09:15:00+02:00",
  "last_effective_range": {
    "from": "2026-08-31",
    "to": "2026-09-06"
  },
  "last_run_status": "success",
  "last_run_counts": {
    "emails": 35,
    "cards": 209,
    "unique_linkedin_urls": 194,
    "duplicates_merged": 15,
    "pipeline_matches": 0,
    "pipeline_added": 0
  },
  "notes": ""
}
```

`last_successful_message_id` and `last_successful_message_at` are the resume
cursor. The remaining fields are audit metadata and may be extended without
changing the resume behavior.

## Resume rules

- A timestamp checkpoint is valid when it is parseable, uses the configured
  timezone or an explicit offset, and is no more than 14 days old.
- For a valid timestamp checkpoint, use zero overlap. Search the smallest
  connector-supported lower bound, compare the returned `email_ts` metadata to
  `last_successful_message_at`, and body-read only newer messages. Use the
  message ID to identify processed emails; use job/requisition URL identity to
  deduplicate repeated cards.
- If the provider timestamp is coarse and returns messages with the exact same
  timestamp, read that small equal-timestamp set and deduplicate by message
  ID. This is not a multi-day overlap.
- A date-only checkpoint is usable as a lower-bound hint but should be treated
  conservatively: use the temporary recovery overlap and keep the previous
  run’s inventory. Do not assume midnight is the true message time. Replace it
  with the exact newest `email_ts` after the first successful run.
- If the checkpoint is missing, malformed, has no usable date, or is more than
  14 days old, use a rolling 14-day Gmail search and record
  `checkpoint_reason: "missing"`, `"invalid"`, or `"stale"` in the run notes.
- When Gmail results change during the run, rerun the same bounded search and
  merge by message ID before committing the checkpoint.
- Never move the checkpoint backwards because a later retry saw fewer emails.
- If parsing, Markdown writing, or a requested pipeline update fails, leave the
  prior checkpoint untouched.

## Atomic update

Write the new JSON to a temporary file in `data/`, validate it, then replace
`data/linkedin-job-alerts-state.json` with an atomic rename. The state update
must be the final write after the Markdown and pipeline operations succeed.

Do not store Gmail credentials, OAuth tokens, personal application answers, CV
contents, or full email bodies in this file.

## Historical bootstrap

The completed initial extraction identified the last visible processed Gmail
message as `1a0774b4db440842` for the 2026-08-31–2026-09-06 run, but did not
capture an exact message timestamp. If this ID is used to seed a checkpoint,
set `checkpoint_precision` to `date`, use `last_successful_message_at` as
`2026-09-06`, and retain the two-day overlap only for that bootstrap recovery
run. The first successful incremental scan should record its exact connector
timestamp and switch `overlap_days` to `0`.
