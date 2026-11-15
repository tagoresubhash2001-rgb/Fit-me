#!/usr/bin/env bash
# One-time Google Cloud setup for FIT ME AI dev (fit-me1). Run by a project Owner in Cloud Shell:
#   https://console.cloud.google.com/cloudshell?project=fit-me1
# Safe to re-run. It does not touch any data.
set -u
PROJECT=fit-me1
SA=firebase-adminsdk-fbsvc@fit-me1.iam.gserviceaccount.com
REPO=tagoresubhash2001-rgb/Fit-me
gcloud config set project "$PROJECT"

echo "1/3 Enabling APIs (takes about a minute)..."
gcloud services enable cloudfunctions.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  run.googleapis.com eventarc.googleapis.com pubsub.googleapis.com secretmanager.googleapis.com \
  firestore.googleapis.com firebasehosting.googleapis.com firebasestorage.googleapis.com storage.googleapis.com \
  identitytoolkit.googleapis.com firebaserules.googleapis.com cloudresourcemanager.googleapis.com iam.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com serviceusage.googleapis.com cloudbilling.googleapis.com

echo "2/3 Granting deploy roles to $SA ..."
for ROLE in roles/firebase.admin roles/cloudfunctions.admin roles/run.admin roles/artifactregistry.admin \
  roles/cloudbuild.builds.editor roles/iam.serviceAccountUser roles/secretmanager.admin \
  roles/serviceusage.serviceUsageAdmin roles/datastore.owner roles/storage.admin; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role="$ROLE" \
    --condition=None --quiet >/dev/null && echo "  granted $ROLE"
done

echo "3/3 Keyless GitHub Actions sign-in (Workload Identity Federation, only $REPO)..."
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions" 2>/dev/null || echo "  pool exists"
gcloud iam workload-identity-pools providers create-oidc fit-me --location=global --workload-identity-pool=github \
  --display-name="Fit-me repository" --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='$REPO'" 2>/dev/null || echo "  provider exists"
PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
gcloud iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PN/locations/global/workloadIdentityPools/github/attribute.repository/$REPO" \
  --quiet >/dev/null && echo "  GitHub repo $REPO may now deploy as $SA"
echo "Done. Project number $PN (the workflow expects 216212194424)."
