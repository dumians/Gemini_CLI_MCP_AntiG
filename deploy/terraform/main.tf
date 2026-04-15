provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "GCP Project Identifier"
  default     = "total-vertex-469513-r8"
}

variable "region" {
  description = "Target provisioning Zone/Region"
  default     = "europe-west3"
}
