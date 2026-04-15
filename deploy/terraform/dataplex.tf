resource "google_dataplex_lake" "data_mesh_lake" {
  name         = "agentic-data-mesh"
  description  = "Governance layer cataloging active model metadata"
  location     = var.region
}

resource "google_dataplex_zone" "curated_zone" {
  lake         = google_dataplex_lake.data_mesh_lake.name
  name         = "curated-zone"
  type         = "CURATED"
  location     = var.region

  resource_spec {
    location_type = "SINGLE_REGION"
  }
}
