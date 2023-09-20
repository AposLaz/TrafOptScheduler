resource "google_service_account" "kubetf" {
  account_id = "kubetf"

  //2 Node groups. 1-without taints, 2-with-taints
}

resource "google_container_node_pool" "general" {
  count      = length(var.cluster-zones)
  name       = "general-cluster-${count.index}"
  cluster    = google_container_cluster.primary[count.index].id
  node_count = 1

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    preemptible  = true
    machine_type = "e2-highcpu-16"
    disk_size_gb = "40"
    disk_type    = "pd-standard"
    image_type   = "COS_CONTAINERD"

    labels = {
      role = "general"
    }

    service_account = google_service_account.kubetf.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

# resource "google_container_node_pool" "spot" {
#   name = "spot"
#   cluster = google_container_cluster.primary.id

#   management {
#     auto_repair = true
#     auto_upgrade = true
#   }

#   autoscaling {
#     min_node_count = 0
#     max_node_count = 10
#   }

#   node_config {
#     preemptible = true
#     machine_type = "e2-small"

#     labels = {
#       team = "devops"  
#     }

#     taint {
#         key = "instance_type"
#         value = "spot"
#         effect = "NO_SCHEDULE"
#     }

#     service_account = google_service_account.kubernetes.email
#     oauth_scopes = [ 
#         "https://www.googleapis.com/auth/cloud-platform" 
#     ]
#   }
# }
