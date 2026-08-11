#!/bin/bash
# deploy.sh
# Deploys the Agentic Data Mesh components to Google Cloud Run (Hardened Enterprise DevOps).

set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="europe-west1"
REPO_NAME="mesh-repo"
ARTIFACT_REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"

echo "Deploying to Project: ${PROJECT_ID} in Region: ${REGION}"
echo "Artifact Registry: ${ARTIFACT_REGISTRY}"

# Ensure Artifact Registry repository exists
gcloud artifacts repositories describe ${REPO_NAME} --location=${REGION} &>/dev/null || \
gcloud artifacts repositories create ${REPO_NAME} --repository-format=docker --location=${REGION} --description="Agentic Data Mesh Docker repo"

# 1. Deploy MCP Servers (Internal Ingress Only, Hardened IAM)
declare -a servers=("oracle-mcp" "spanner-mcp" "bigquery-mcp" "alloydb-mcp")

for server in "${servers[@]}"
do
    echo "--- Deploying ${server} ---"
    IMAGE_NAME="${ARTIFACT_REGISTRY}/${server}:latest"
    
    # Build & push image
    docker build -t ${IMAGE_NAME} -f deploy/Dockerfile.mcp . --build-arg SERVER_PATH="servers/${server}/index.js"
    docker push ${IMAGE_NAME}
    
    # Base Cloud Run flags for MCP microservices
    # Crucial bugfix: Pass MCP_SERVICE env variable so the generic container runs the correct service
    FLAGS="--image ${IMAGE_NAME} --platform managed --region ${REGION} --no-allow-unauthenticated --ingress internal-and-cloud-load-balancing --timeout 3600 --session-affinity --set-env-vars=NODE_ENV=production,GCP_PROJECT_ID=${PROJECT_ID},MCP_SERVICE=${server}"
    
    # Attach Direct VPC Egress for private IP databases (AlloyDB and Oracle)
    if [ "${server}" == "alloydb-mcp" ] || [ "${server}" == "oracle-mcp" ]; then
        FLAGS="${FLAGS} --network default --subnet default --vpc-egress private-ranges-only"
    fi

    gcloud run deploy ${server} ${FLAGS}
done

# 2. Get deployed MCP service URLs dynamically
echo "Retrieving deployed MCP service endpoints..."
SPANNER_MCP_URL=$(gcloud run services describe spanner-mcp --platform managed --region ${REGION} --format="value(status.url)" 2>/dev/null || echo "")
BIGQUERY_MCP_URL=$(gcloud run services describe bigquery-mcp --platform managed --region ${REGION} --format="value(status.url)" 2>/dev/null || echo "")
ALLOYDB_MCP_URL=$(gcloud run services describe alloydb-mcp --platform managed --region ${REGION} --format="value(status.url)" 2>/dev/null || echo "")
ORACLE_MCP_URL=$(gcloud run services describe oracle-mcp --platform managed --region ${REGION} --format="value(status.url)" 2>/dev/null || echo "")

# 3. Deploy Master Orchestrator (External Ingress, Secret Manager Key)
echo "--- Deploying Master Orchestrator ---"
ORCH_IMAGE="${ARTIFACT_REGISTRY}/mesh-orchestrator:latest"
docker build -t ${ORCH_IMAGE} -f deploy/Dockerfile.orchestrator .
docker push ${ORCH_IMAGE}

gcloud run deploy mesh-orchestrator \
    --image ${ORCH_IMAGE} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --ingress all \
    --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=${PROJECT_ID},SPANNER_MCP_URL=${SPANNER_MCP_URL}/sse,BIGQUERY_MCP_URL=${BIGQUERY_MCP_URL}/sse,ALLOYDB_MCP_URL=${ALLOYDB_MCP_URL}/sse,ORACLE_MCP_URL=${ORACLE_MCP_URL}/sse,HR_MCP_URL=${ORACLE_MCP_URL}/sse,WAREHOUSE_MCP_URL=${ORACLE_MCP_URL}/sse" \
    --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"

# 4. Deploy WebApp UIX (External Ingress)
echo "--- Deploying WebApp UIX ---"
WEB_IMAGE="${ARTIFACT_REGISTRY}/mesh-webapp:latest"
ORCH_URL=$(gcloud run services describe mesh-orchestrator --platform managed --region ${REGION} --format="value(status.url)")

docker build -t ${WEB_IMAGE} -f deploy/Dockerfile.webapp . --build-arg VITE_API_BASE_URL="${ORCH_URL}"
docker push ${WEB_IMAGE}

gcloud run deploy mesh-webapp \
    --image ${WEB_IMAGE} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --ingress all

echo "Enterprise Cloud Run Deployment complete."
