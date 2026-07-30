# Career-Ops Web Dashboard

Filesystem-backed Next.js dashboard for the Career-Ops tracker, reports, job descriptions, skill scans, and interview preparation.

## Development

```bash
npm install
npm run dev
```

The dashboard reads the parent Career-Ops repository by default. Set `CAREER_OPS_ROOT` only when it lives elsewhere.

```bash
CAREER_OPS_ROOT=/absolute/path/to/career-ops npm run dev
```

## Write access

Status updates are deliberately limited to requests made from `localhost` by default. If you intentionally expose the dashboard on a network interface or through a proxy, configure matching tokens for the server and dashboard client:

```bash
DASHBOARD_WRITE_TOKEN=replace-with-a-long-random-value \
NEXT_PUBLIC_DASHBOARD_WRITE_TOKEN=replace-with-a-long-random-value \
npm run start
```

The client-side value lets the dashboard make status updates; it is not user authentication. Expose the dashboard only behind authenticated infrastructure when it is reachable beyond your machine.

Artifact pages are restricted to saved job descriptions, skills scans, and interview-prep markdown files; they cannot be used to browse repository files such as `.env`, the CV, or tracker configuration.

## Verification

```bash
npm test
npm run lint
npm run build
```
