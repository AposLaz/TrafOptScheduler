########################## PROVIDER ###############################

# Define a backend for store the state

terraform {
  backend "gcs" {
    bucket = "multicluster_bucket"
    prefix = "terraform/state"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.65.2"
    }

    google-beta = {
      source  = "hashicorp/google-beta"
      version = "3.67.0"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "2.20.0"
    }

    helm = {
      source  = "hashicorp/helm"
      version = "2.9.0"
    }

    kubectl = {
      source  = "gavinbunney/kubectl"
      version = ">= 1.7.0"
    }

  }
}

provider "google" {
  project     = var.project-id
  region      = var.region
  credentials = file("${var.credentials_gcp}/secrets.json")
}

provider "google-beta" {
  credentials = file("${var.credentials_gcp}/secrets.json")
  project     = var.project-id
}

provider "kubernetes" {
  host                   = "https://${google_container_cluster.primary.endpoint}"
  token                  = data.google_client_config.main.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth.0.cluster_ca_certificate)
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config"
  }
}

provider "kubectl" {
  host                   = "https://${google_container_cluster.primary.endpoint}"
  token                  = data.google_client_config.main.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth.0.cluster_ca_certificate)
  load_config_file       = false
}
