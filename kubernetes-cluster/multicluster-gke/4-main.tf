# Retrieve an access token as the Terraform runner
data "google_client_config" "main" {}

#Enable compute API
#To create a GKE cluster, you also need to enable container google API

#compute engine API
resource "google_project_service" "compute" {
  service                    = "compute.googleapis.com"
  disable_dependent_services = true
}

#kubernetes API
resource "google_project_service" "container" {
  service                    = "container.googleapis.com"
  disable_dependent_services = true
}

#MULTICLUSTER DISCOVERY API
resource "google_project_service" "multi-cluster-discovery" {
  service                    = "multiclusterservicediscovery.googleapis.com"
  disable_dependent_services = true
}
#GKE HUB API
resource "google_project_service" "gke-hub" {
  service                    = "gkehub.googleapis.com"
  disable_dependent_services = true
}

#CLOUD RESOURCE MANAGER
resource "google_project_service" "cloud-resource-manager" {
  service                    = "cloudresourcemanager.googleapis.com"
  disable_dependent_services = true
}
#TRAFFIC DIRECTOR API
resource "google_project_service" "traffic-director" {
  service                    = "trafficdirector.googleapis.com"
  disable_dependent_services = true
}

#CLOUD DNS API
resource "google_project_service" "cloud-dns" {
  service                    = "dns.googleapis.com"
  disable_dependent_services = true
}

#ANTHOS API
resource "google_project_service" "anthos" {
  service                    = "anthos.googleapis.com"
  disable_dependent_services = true
}

#TRACE
resource "google_project_service" "cloud-trace" {
  service                    = "cloudtrace.googleapis.com"
  disable_dependent_services = true
}

#Mesh
resource "google_project_service" "mesh" {
  service                    = "mesh.googleapis.com"
  disable_dependent_services = true
}

#MeshA
resource "google_project_service" "meshca" {
  service                    = "meshca.googleapis.com"
  disable_dependent_services = true
}

#Telemetry
resource "google_project_service" "telemetry" {
  service                    = "meshtelemetry.googleapis.com"
  disable_dependent_services = true
}

#Meshconfig
resource "google_project_service" "meshconfig" {
  service                    = "meshconfig.googleapis.com"
  disable_dependent_services = true
}

#iamcredentials
resource "google_project_service" "iamcredentials" {
  service                    = "iamcredentials.googleapis.com"
  disable_dependent_services = true
}

#GKE connect
resource "google_project_service" "gkeconnect" {
  service                    = "gkeconnect.googleapis.com"
  disable_dependent_services = true
}

#monitoring
resource "google_project_service" "monitoring" {
  service                    = "monitoring.googleapis.com"
  disable_dependent_services = true
}

#logging
resource "google_project_service" "logging" {
  service                    = "logging.googleapis.com"
  disable_dependent_services = true
}

#profiling
resource "google_project_service" "profiler" {
  service                    = "cloudprofiler.googleapis.com"
  disable_dependent_services = true
}

#iam
resource "google_project_service" "iam" {
  service                    = "iam.googleapis.com"
  disable_dependent_services = true
}
