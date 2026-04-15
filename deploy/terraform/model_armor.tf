resource "google_project_service" "model_armor_api" {
  project = var.project_id
  service = "modelarmor.googleapis.com"

  disable_on_destroy = false
}
