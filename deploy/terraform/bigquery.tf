resource "google_bigquery_dataset" "analytics_ds" {
  dataset_id = "analytics_hub"
  location   = var.region
}

resource "google_bigquery_table" "analytics_table" {
  dataset_id = google_bigquery_dataset.analytics_ds.dataset_id
  table_id   = "customer_segments"
  schema     = <<EOF
[
  {"name": "segment_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "segment_name", "type": "STRING", "mode": "NULLABLE"},
  {"name": "lifetime_value", "type": "FLOAT", "mode": "NULLABLE"}
]
EOF
}
