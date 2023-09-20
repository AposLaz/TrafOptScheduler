################################### PROVIDER ##############################
variable "credentials_gcp" {
  type        = string
  description = "My project credentials"
}

variable "project-id" {
  type        = string
  description = "My project Id"
}

variable "region" {
  type        = string
  description = "Region for GKE cluster"
}

variable "zone" {
  type        = string
  description = "Zone for GKE cluster"
}

#######################################  GKE REGIONS & ZONES #########################################
variable "cluster-regions" {
  description = "Create clusters in different regions"
  type        = list(string)
  default     = ["europe-west3", "europe-west8"]
}

variable "cluster-zones" {
  description = "Create clusters in different zones"
  type        = list(string)
  default     = ["europe-west3-a", "europe-west8-a"]
}

variable "ip_cidr_range_clusters" {
  description = "Ip CIDR for clusters"
  type        = list(string)
  default     = ["10.156.0.0/20", "10.198.0.0/20"]
}

variable "pods_ip_range" {
  description = "Pod Ip Ranges"
  type        = list(string)
  default     = ["10.64.0.0/14", "10.120.0.0/14"]
}

variable "services_ip_range" {
  description = "Services Ip Ranges"
  type        = list(string)
  default     = ["10.68.0.0/20", "10.124.0.0/20"]
}

######################################################################################################

#VPC k8s-main
variable "vpc-name" {
  type        = string
  description = "VPC network for GKE"
}


