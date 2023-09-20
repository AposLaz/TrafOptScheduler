resource "google_compute_firewall" "allow-ports" {
  name    = "allow-ports"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["15017", "15002"]
  }

  source_ranges = ["0.0.0.0/0"]
}
