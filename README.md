# 1. SETUP CLUSTERS

Suppose that you have a project in GCP. If not create one

## Set up environment

Before begin have to set up terraform credentials for GCP.

Follow the steps in the links below for download it in json format:

1. https://www.youtube.com/watch?v=gb0bytUGDnQ
2. https://stackoverflow.com/questions/46287267/how-can-i-get-the-file-service-account-json-for-google-translate-api

> **secrets.json** contain the API key for your relative project in GCP. API key is a unique alphanumeric string that associates your Google billing account with your project, and with the specific API or SDK. Follow the instructions from original tutorial for set up and get API key [_https://developer.hashicorp.com/terraform/tutorials/gcp-get-started/google-cloud-platform-build_](https://developer.hashicorp.com/terraform/tutorials/gcp-get-started/google-cloud-platform-build)

After you download json file, give it the name `secrets.json`.
Create a folder credentials in `kubernetes-cluster` path.

In `/credentials` locate the json file `secrets.json`. So now the path must be `/kubernetes-cluster/credentials/secrets.json`.

The tree path should be:

```bash

$ tree
.
├── kubernetes-cluster/
│   ├── credentials/        <------ here is credentials folder
|   |   └── secrets.json
|   ..........................
|   .........................
└── README.md

```

## Create a bucket in GCP

Bucket has the purpose to create a tf-state file over there.
If you are not familiar with terraform then just follow the instruction

Go in folder `/bucket`

```sh
cd kubernetes-cluster/modules/bucket
```

Open file `variable.tf` and configure variables in default:

```js
################################### PROVIDER ##############################
variable "credentials_gcp" { default = "PATH FROM CREDENTIALS" }
variable "project-id" { default = "YOUR PROJECT ID" }
variable "region" { default = "ZONE FOR YOUR PROVIDER" }

################################### BUCKET ###################################
variable "bucket_name" { default = "BUCKET NAME" }
variable "bucket_location" { default = "BUCKET LOCATION" }
variable "storage_class" { default = "BUCKET CLASS" }
```

Follow the link for more about Buckets and Terraform https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/storage_bucket

Here I provide an example of my `variable.tf`

```js
################################### PROVIDER ##############################
variable "credentials_gcp" { default = "/home/apostolos/Desktop/k8s-traffic-split/kubernetes-cluster/credentials" }
variable "project-id" { default = "lively-shelter-294615" }
variable "region" { default = "europe-west8-a" }

################################### BUCKET ###################################
variable "bucket_name" { default = "state-tf-bucket" }
variable "bucket_location" { default = "EU" }
variable "storage_class" { default = "STANDARD" }
```

When you finish the setup follow the instructions for create the bucket

```sh
# Create Bucket
./plan_v1.sh kubernetes-cluster/modules/bucket/

./apply_v1.sh kubernetes-cluster/modules/bucket/

# Destroy Bucket (Run it only if you want to destroy the bucket)
./destroy_v1.sh kubernetes-cluster/modules/bucket/
```

Well Done!!! now you are Ready create your Multicluster

## Create GKE (Google Kubernetes Engines)

By default create 5 GKE clusters if you want more clusters see instructions in the end of section

Like in buckets we have configure variables

So first go in file `1-variables.tfvars`

```sh
cd kubernetes-cluster/multicluster-gke/1-variables.tfvars
```

And configure variables

```sh
credentials_gcp = "PATH FOR CREDENTIALS"
project-id      = "YOUR PROJECT ID"
region          = "REGION OF PROVIDER"
zone            = "ZONE OF PROVIDER"
vpc-name        = "NAME FOR YOUR VPC"
```

Here I provide an example of my `1-variables.tfvars`

```sh
credentials_gcp = "/home/apostolos/Desktop/k8s-traffic-split/kubernetes-cluster/credentials"
project-id      = "lively-shelter-294615"
region          = "europe-west3"
zone            = "europe-west3-c"
vpc-name        = "vpc-multicluster"
```

**After set up variables run below commands for create GKE clusters**

May need **20 minutes** or more for complete installation

```sh
# Create Multi-cluster
./plan_v2.sh kubernetes-cluster/multicluster-gke/ 1-variables.tfvars
./apply_v2.sh kubernetes-cluster/multicluster-gke/ 1-variables.tfvars

# Destroy Multicluster (Run it only if you want to destroy the Multicluster)
./destroy_v2.sh kubernetes-cluster/multicluster-gke/ 1-variables.tfvars
```

expected output

```js
{"@level":"info","@message":"Outputs: 1","@module":"terraform.ui","@timestamp":"2023-09-20T15:42:34.561607+03:00","outputs":{"region":{"sensitive":false,"type":"string","value":"europe-west3"}},"type":"outputs"}
```

If you want to create more GKE then you have to configure variables `kubernetes-cluster/multicluster-gke/0-variables.tf` and variables inside comments

```js
variable "cluster-regions" {}
variable "cluster-zones" {}
variable "ip_cidr_range_clusters" {}
variable "pods_ip_range" {}
variable "services_ip_range" {}
```

## Install Anthos Service Mesh and Prometheus

If you want to set up anthos and prometheus then run the following command

```sh
./kubernetes-cluster/setup-cluster.sh
```

If you need more clusters then add some lines in this file. For example for 6 GKE clusters with anthos add the following in the beginning under `CLUSTER_NAME_5`

```sh
export CLUSTER_NAME_6="CLUSTER NAME"
export CLUSTER_ZONE_6="ZONE OF CLUSTER"
export CTX_6="gke_${PROJECT_ID}_${CLUSTER_ZONE_6}_${CLUSTER_NAME_6}"
```

## Install Apps Online Boutique

You can run more apps but if you want to run online boutique in each cluster then run the following.

```sh
./kubernetes-cluster/setup-apps.sh
```

# 2. RUN PLACEMENT AND UI