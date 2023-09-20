require('dotenv').config()

module.exports = {
    CLUSTERS_IP: process.env.ALL_CLUSTERS_IP.split(",")
}