resource "google_spanner_instance" "retail_instance" {
  config       = "regional-europe-west3"
  display_name = "Retail Spanner Instance"
  name         = "retail-instance"
  num_nodes    = 1
}

resource "google_spanner_database" "retail_db" {
  instance = google_spanner_instance.retail_instance.name
  name     = "retail_database"
  ddl      = [
    "CREATE TABLE customers (customer_id STRING(36) NOT NULL, name STRING(100), email STRING(100)) PRIMARY KEY (customer_id)"
  ]
}
