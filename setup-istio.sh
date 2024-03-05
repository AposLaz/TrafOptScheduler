gcloud container clusters get-credentials cluster-1 --zone europe-west8-c --project lively-shelter-294615

kubectl apply -f istio/1-istio-init.yaml

sleep 20

kubectl apply -f istio/2-istio-minikube.yaml
kubectl apply -f istio/3-kiali-secret.yaml

kubectl apply -f kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/namespaces/online-boutique.yaml
kubectl label ns online-boutique istio-injection=enabled

kubectl apply -f kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/services

kubectl apply -f kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/deployments/cluster-0