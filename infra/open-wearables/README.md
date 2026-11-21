# Open Wearables bridge (cloud wearables) — NOT DEPLOYED

Status: code in FitMe is built and deployed (`wearablesStatus`, `wearablesConnect`, `wearablesDisconnect`,
`wearablesSync` in `functions/src/wearables/openWearables.ts`). The Open Wearables backend itself is **not deployed**:
it costs money every month and needs the owner's approval first. Until it exists every call returns
`not_configured` and the app shows "Not available yet" for Garmin, Oura, WHOOP, Polar, Suunto, Strava, Fitbit/Google
and Withings. On-device data (Apple Health, Health Connect, phone step counter) does not need this.

## Why Open Wearables

- MIT licence (github.com/the-momentum/open-wearables) — can be self-hosted and modified.
- One OAuth + sync layer for many cloud providers; FitMe only talks to it from Cloud Functions with an API key
  (`X-Open-Wearables-API-Key`), maps each Firebase uid to an Open Wearables user (`external_user_id = uid`, mapping in
  `wearableLinks/{uid}`, server-only), and writes normalised days to `users/{uid}/healthDaily/cloud-{date}` and
  `users/{uid}/stepLogs/cloud-{date}`. Step de-duplication in the app prefers health platform > cloud > phone > manual.
- Open Health Sync (AGPL-3.0) was read as a design reference only; none of its code is copied, bundled or linked.
- Traccar (Apache-2.0) was a reference for GPS filtering ideas only (accuracy gate, speed spikes, jitter); it is not
  deployed and no code is copied.

## Target architecture (same GCP project as Firebase, non-prod first)

| Piece | Service | Notes |
|---|---|---|
| API (`scripts/start/app.sh`) | Cloud Run, min 0 / max 2, 1 vCPU 1 GiB | Ingress internal + Cloud Functions via IAM, or public with API key only |
| Celery worker | Cloud Run (always on, 1 instance) or Cloud Run job + Scheduler | provider sync |
| Celery beat | Cloud Run, 1 instance | periodic sync |
| Postgres 18 | Cloud SQL `db-f1-micro`, 10 GB SSD | private IP |
| Redis | Memorystore Basic 1 GB | private IP |
| VPC access | Serverless VPC connector (or Direct VPC egress) | Cloud Run → Cloud SQL / Redis |
| Secrets | Secret Manager | `OPEN_WEARABLES_API_KEY`, `SECRET_KEY`, DB password, each provider's client id/secret |

Not deployed: frontend dashboard, flower, svix (outgoing webhooks off).

## Expected monthly cost (asia-south1, list prices, before free tier)

| Item | Approx. USD / month |
|---|---|
| Cloud SQL db-f1-micro + 10 GB SSD + backups | 10–15 |
| Memorystore Redis Basic 1 GB | ~35 |
| Cloud Run API (scale to zero) + worker + beat (always-on, smallest CPU) | 15–40 |
| Serverless VPC connector (2 × e2-micro) | ~10 |
| Secret Manager, logging, egress | 1–5 |
| **Total** | **≈ 70–105** |

Cheaper option (≈ 25–45): one small Compute Engine e2-small VM running the docker-compose stack (Postgres + Redis
on the VM) — less managed, owner must accept patching/backups.

## Developer accounts needed (one per provider)

| Provider | Where to apply |
|---|---|
| Garmin Connect Developer Program | https://developer.garmin.com/gc-developer-program/ |
| Oura API | https://cloud.ouraring.com/oauth/applications |
| WHOOP Developer | https://developer.whoop.com/ |
| Polar AccessLink | https://admin.polaraccesslink.com/ |
| Suunto API Zone | https://apizone.suunto.com/ |
| Strava API | https://www.strava.com/settings/api |
| Google Health API (Fitbit) | https://developers.google.com/health |
| Withings Developer | https://developer.withings.com/ |

Each gives a client id + secret; the OAuth redirect URL is `https://<open-wearables-api>/api/v1/oauth/<provider>/callback`.

## Deployment steps (run only after approval; non-prod project first)

Note: Cloud Run expects every service to listen on a port; if the worker/beat images do not, run them as a Compute Engine VM or add a tiny health endpoint. Verify on the non-prod project first.

See `deploy.sh` (guarded; refuses to run without `I_APPROVE_COST=yes` and refuses `*prod*` projects). After it
finishes:

1. Put the API key in Secret Manager as `OPEN_WEARABLES_API_KEY` (Functions read it via `webhookSecret`).
2. Write `serverConfig/openWearables` = `{ baseUrl: "https://<cloud-run-url>" }` with the Admin SDK.
3. Add each provider's client id/secret as Cloud Run secrets and redeploy the API.
4. Redeploy `wearables*` functions (they read the secret at runtime, no code change).
