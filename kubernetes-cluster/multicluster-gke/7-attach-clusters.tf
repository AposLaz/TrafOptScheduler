resource "null_resource" "connecto_gcloud" {
  count = length(var.cluster-zones)
  provisioner "local-exec" {
    command = "gcloud container clusters get-credentials cluster-${count.index} --zone ${var.cluster-zones[count.index]} --project ${var.project-id}"
  }

  depends_on = [
    google_container_node_pool.general
  ]
}
