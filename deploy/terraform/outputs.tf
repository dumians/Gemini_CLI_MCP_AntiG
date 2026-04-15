output "spanner_connection_string" {
  value = "spanner://${var.project_id}/${google_spanner_instance.retail_instance.name}/${google_spanner_database.retail_db.name}"
}

output "bigquery_dataset_id" {
  value = google_bigquery_dataset.analytics_ds.dataset_id
}

output "alloydb_connection_name" {
  value = google_alloydb_instance.crm_instance.id
}
