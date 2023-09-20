# Create new storage bucket in the EU multi-region
# with standard storage

resource "google_storage_bucket" "state-tf-bucket" {
  name = var.bucket_name
  location = var.bucket_location
  storage_class = var.storage_class  

  /**
    force_destroy - (Optional, Default: false) When deleting a bucket, 
    this boolean option will delete all contained objects. If you try to 
    delete a bucket that contains objects, Terraform will fail that run.
  */
  force_destroy = true 
  
  versioning {
    enabled = true
  }
}