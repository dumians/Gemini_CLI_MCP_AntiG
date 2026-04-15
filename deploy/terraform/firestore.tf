resource "google_firestore_database" "mesh_firestore" {
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
}
