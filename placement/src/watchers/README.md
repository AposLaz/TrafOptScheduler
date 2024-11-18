# Watchers listen to k8s requests

1. watcher for namespaces - find new or deleted namespaces
2. create pod watcher for each namespace
3. if a namespace deleted then the related pod watcher end
4. if a pod added / deleted then run optTraffic
