#!/bin/bash

# Multi-Domain Data Agent Demo (ADK) - GCP Deployment Script
# Note: Ensure you have `gcloud` installed and authenticated (`gcloud auth login`)
# Note: Ensure `bq`, and `psql` are also available.

set -e

PROJECT_ID=$(gcloud config get-value project)
echo "Deploying demo infrastructure to Project: $PROJECT_ID"

# 1. BigQuery Setup
echo "Creating BigQuery Dataset and Tables..."
bq mk --force=true marketing_edw || true
bq query --use_legacy_sql=false < ../db-schemas/bigquery_schema.sql

# 2. AlloyDB Setup
# Note: This assumes you have already provisioned an AlloyDB cluster named 'crm-cluster'
# and have started the AlloyDB Auth proxy locally on port 5432.
echo "Setting up AlloyDB Schema (requires PgBouncer / Auth Proxy running)..."
# psql -h localhost -p 5432 -U postgres -d postgres -f ../db-schemas/alloydb_schema.sql || echo "AlloyDB connection skipped."

# 3. Spanner Setup
# Create instance and database if they don't exist
echo "Creating Spanner Instance and Database..."
# gcloud spanner instances create global-retail-instance --config=regional-us-central1 --description="Global Retail" --nodes=1 || true
# gcloud spanner databases create global-retail-db --instance=global-retail-instance || true
# gcloud spanner databases ddl update global-retail-db --instance=global-retail-instance --file=../db-schemas/spanner_schema.sql || echo "Spanner DDL deployment skipped."

# 4. Oracle DB@GCP
# Note: Oracle DB provisioning on GCP is a specialized process via the Oracle integration portal.
# This script assumes you connect via your standard Oracle JDBC/Node.js Driver to your provisioned endpoint.
echo "Oracle setup requires manual JDBC execution against your DB@GCP endpoint."

echo "Deployment scripts executed (some steps commented out for safety)."
