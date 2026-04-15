resource "google_cloud_run_v2_service" "mcp_gateway_service" {
  name     = "one-mcp-gateway"
  location = var.region
  
  template {
    containers {
      image = "gcr.io/${var.project_id}/one-mcp-gateway:latest"
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }
}
