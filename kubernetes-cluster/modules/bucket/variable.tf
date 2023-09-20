################################### PROVIDER ##############################
variable "credentials_gcp" { default = "/home/apostolos/Desktop/k8s-traffic-split/kubernetes-cluster/credentials" }
variable "project-id" { default = "lively-shelter-294615" }
variable "region" { default = "europe-west8-a" }

################################### BUCKET ###################################
variable "bucket_name" { default = "state-tf-bucket" }
variable "bucket_location" { default = "EU" }
variable "storage_class" { default = "STANDARD" }
