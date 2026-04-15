resource "google_alloydb_cluster" "crm_cluster" {
  cluster_id = "crm-cluster"
  location   = var.region
  network    = "default" # Adjust vpc peering name if necessary
}

resource "google_alloydb_instance" "crm_instance" {
  cluster       = google_alloydb_cluster.crm_cluster.name
  instance_id   = "crm-instance"
  instance_type = "PRIMARY"
  
  machine_config {
    cpu_count = 2
  }
}
