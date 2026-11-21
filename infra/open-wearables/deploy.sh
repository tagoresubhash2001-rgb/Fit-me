#!/usr/bin/env bash
# Self-hosts Open Wearables for FitMe on Cloud Run + Cloud SQL + Memorystore. NOT RUN YET: needs cost approval.
set -euo pipefail
: "${PROJECT:?set PROJECT (non-prod Firebase project id)}"
REGION="${REGION:-asia-south1}"
[[ "${I_APPROVE_COST:-}" == "yes" ]] || { echo "Refusing: set I_APPROVE_COST=yes after the owner approves ~USD 70-105/month."; exit 1; }
[[ "$PROJECT" != *prod* ]] || { echo "Refusing to deploy to a production project."; exit 1; }
SRC="${SRC:?set SRC to a checkout of github.com/the-momentum/open-wearables}"

gcloud services enable run.googleapis.com sqladmin.googleapis.com redis.googleapis.com vpcaccess.googleapis.com \
  secretmanager.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project "$PROJECT"

gcloud compute networks vpc-access connectors create ow-connector --region "$REGION" --range 10.8.0.0/28 --project "$PROJECT" || true
gcloud sql instances create ow-db --database-version POSTGRES_17 --tier db-f1-micro --region "$REGION" \
  --storage-size 10 --network default --no-assign-ip --project "$PROJECT" || true
gcloud sql databases create openwearables --instance ow-db --project "$PROJECT" || true
DB_PASS="$(openssl rand -hex 24)"
gcloud sql users create ow --instance ow-db --password "$DB_PASS" --project "$PROJECT" || true
gcloud redis instances create ow-redis --size 1 --region "$REGION" --tier basic --project "$PROJECT" || true

for s in OW_DB_PASSWORD OW_SECRET_KEY OPEN_WEARABLES_API_KEY; do
  gcloud secrets describe "$s" --project "$PROJECT" >/dev/null 2>&1 || gcloud secrets create "$s" --project "$PROJECT"
done
printf %s "$DB_PASS" | gcloud secrets versions add OW_DB_PASSWORD --data-file=- --project "$PROJECT"
openssl rand -hex 32 | tr -d '\n' | gcloud secrets versions add OW_SECRET_KEY --data-file=- --project "$PROJECT"
openssl rand -hex 32 | tr -d '\n' | gcloud secrets versions add OPEN_WEARABLES_API_KEY --data-file=- --project "$PROJECT"

IMAGE="$REGION-docker.pkg.dev/$PROJECT/open-wearables/platform:latest"
gcloud artifacts repositories create open-wearables --repository-format docker --location "$REGION" --project "$PROJECT" || true
gcloud builds submit "$SRC/backend" --tag "$IMAGE" --project "$PROJECT"

DB_IP="$(gcloud sql instances describe ow-db --project "$PROJECT" --format 'value(ipAddresses[0].ipAddress)')"
REDIS_IP="$(gcloud redis instances describe ow-redis --region "$REGION" --project "$PROJECT" --format 'value(host)')"
COMMON=(--image "$IMAGE" --region "$REGION" --project "$PROJECT" --vpc-connector ow-connector
  --set-env-vars "ENVIRONMENT=production,DB_HOST=$DB_IP,DB_PORT=5432,DB_NAME=openwearables,DB_USER=ow,REDIS_HOST=$REDIS_IP,REDIS_PORT=6379,OUTGOING_WEBHOOKS_ENABLED=false"
  --set-secrets "DB_PASSWORD=OW_DB_PASSWORD:latest,SECRET_KEY=OW_SECRET_KEY:latest,OPEN_WEARABLES_API_KEY=OPEN_WEARABLES_API_KEY:latest")

gcloud run deploy ow-api "${COMMON[@]}" --command scripts/start/app.sh --port 8000 --min-instances 0 --max-instances 2 --allow-unauthenticated
gcloud run deploy ow-worker "${COMMON[@]}" --command scripts/start/worker.sh --no-cpu-throttling --min-instances 1 --max-instances 1 --no-allow-unauthenticated
gcloud run deploy ow-beat "${COMMON[@]}" --command scripts/start/beat.sh --no-cpu-throttling --min-instances 1 --max-instances 1 --no-allow-unauthenticated

echo "API URL: $(gcloud run services describe ow-api --region "$REGION" --project "$PROJECT" --format 'value(status.url)')"
echo "Next: write serverConfig/openWearables.baseUrl and add provider client ids/secrets (see README)."
