#!/bin/bash
# deploy.sh
# Deploys the Agentic Data Mesh components to Google Cloud Run.

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"

echo "Deploying to Project: $PROJECT_ID in Region: $REGION"

# 1. Deploy MCP Servers
declare -a servers=("oracle-mcp" "spanner-mcp" "bigquery-mcp" "alloydb-mcp")

for server in "${servers[@]}"
do
    echo "--- Deploying $server ---"
    IMAGE_NAME="gcr.io/$PROJECT_ID/$server"
    
    # Build image
    docker build -t $IMAGE_NAME -f deploy/Dockerfile.mcp . --build-arg SERVER_PATH="servers/$server/index.js"
    docker push $IMAGE_NAME
    
    # Deploy to Cloud Run
    gcloud run deploy $server \
        --image $IMAGE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --set-env-vars="NODE_ENV=production"
done

# 2. Deploy Orchestrator
echo "--- Deploying Master Orchestrator ---"
ORCH_IMAGE="gcr.io/$PROJECT_ID/data-orchestrator"
docker build -t $ORCH_IMAGE -f deploy/Dockerfile.orchestrator .
docker push $ORCH_IMAGE

gcloud run deploy data-orchestrator \
    --image $ORCH_IMAGE \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=YOUR_KEY"

echo "Deployment complete."
