# Deploy targets

Read by `/ship` (smoke test) and the `ui-tester` agent.

## Production URLs

Not recorded yet. `/ship` asks on its first run and fills these in.

| What | URL |
|---|---|
| Frontend (CloudFront) | _unset_ |
| API base (EC2) | _unset_ — `/health` must be reachable here |

## What deploys when

| Merge to `main` touching | Workflow | Result |
|---|---|---|
| `server/**` or `docker-compose.prod.yml` | `cd-backend.yml` | Image → ECR → EC2 `docker compose up -d --pull always` |
| `client/**` | `cd-frontend.yml` | Vite build → S3 sync → CloudFront invalidation |
