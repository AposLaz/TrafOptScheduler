resource "google_container_cluster" "primary" {
  count                    = length(var.cluster-zones)
  name                     = "cluster-${count.index}"
  location                 = var.cluster-zones[count.index]
  remove_default_node_pool = true
  initial_node_count       = 1
  /**
    Define how applications in this cluster communicate with each other and with 
    the Kubernetes control plane, and how clients can reach them.
  */
  #   network    = google_compute_network.k8s-main-vpc.self_link
  #   subnetwork = google_compute_subnetwork.k8s-main-subnets[count.index].self_link

  # logging_service    = "none"
  # monitoring_service = "none"
  networking_mode = "VPC_NATIVE"

  /* If we want NODE run in specific zones then specify them */
  /**
    node_locations = [ 
        "europe-west8-a",
        "europe-west8-b",
        "europe-west8-c"
    ]
  */

  addons_config {
    # http_load_balancing {
    #   disabled = true
    # }

    horizontal_pod_autoscaling {
      disabled = true
    }
  }

  vertical_pod_autoscaling {
    enabled = false
  }

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "${var.project-id}.svc.id.goog"
  }

  ip_allocation_policy {
    cluster_ipv4_cidr_block  = var.pods_ip_range[count.index]
    services_ipv4_cidr_block = var.services_ip_range[count.index]
  }

  # private_cluster_config {
  #   enable_private_nodes    = true
  #   enable_private_endpoint = false
  #   master_ipv4_cidr_block  = "172.16.0.0/28"
  # }
  depends_on = [
    google_project_service.compute,
    google_project_service.container,
    google_project_service.cloud-resource-manager,
    google_project_service.gkeconnect,
    google_project_service.iam,
    google_project_service.gke-hub,
    google_project_service.iamcredentials,
    google_project_service.monitoring,
    google_project_service.logging
  ]
}
