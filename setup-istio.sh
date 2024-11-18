#gcloud container clusters get-credentials cluster-1 --zone us-central1-c --project lively-shelter-294615
#aws eks --region eu-central-1 update-kubeconfig --name aplazTest
# https://discuss.istio.io/t/building-istio-with-custom-envoy/7239

# install istio
# curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.22.0 TARGET_ARCH=x86_64 sh -
# curl -sL https://istio.io/downloadIstioctl | sh -
export PATH=$HOME/.istioctl/bin:$PATH

cd istio-1.22.0

export PATH=$PWD/bin:$PATH
#istioctl proxy-status

istioctl install --set profile=demo -y

kubectl label namespace default istio-injection=enabled
kubectl create ns online-boutique
kubectl label namespace online-boutique istio-injection=enabled

cd ..

# install all addons
kubectl apply -f addons/istio/addons

# deploy online boutique
kubectl apply -f kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/namespaces
kubectl apply -f kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/deployments

# [AWS] => kubectl port-forward svc/kiali 20001:20001 -n istio-system
# [AWS] => sudo ssh -i /home/apostolos/Downloads/EksWorkerNodeKeyPair.pem ec2-user@3.120.153.172

# kubectl delete -f istio/1-istio-init.yaml

# sleep 20

# kubectl delete -f istio/2-istio-minikube.yaml
# kubectl delete -f istio/3-kiali-secret.yaml

# kubectl apply -f kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/namespaces/online-boutique.yaml
# kubectl label ns online-boutique istio-injection=enabled

# kubectl apply -f kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/services

# kubectl apply -f kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/deployments/cluster-0

# hello world app
# kubectl label namespace default istio-injection=enabled --overwrite

# kubectl apply -f hello-world/deploy.yaml
# kubectl apply -f hello-world/gateway.yaml
# kubectl apply -f hello-world/virtual-svc.yaml
# kubectl apply -f hello-world/rule.yaml



# gcloud beta container --project "lively-shelter-294615" clusters create "cluster-0" --region "europe-west8" --no-enable-basic-auth --cluster-version "1.29.7-gke.1104000" --release-channel "regular" --machine-type "n2-standard-2" --image-type "COS_CONTAINERD" --disk-type "pd-balanced" --disk-size "20" --metadata disable-legacy-endpoints=true --scopes "https://www.googleapis.com/auth/devstorage.read_only","https://www.googleapis.com/auth/logging.write","https://www.googleapis.com/auth/monitoring","https://www.googleapis.com/auth/servicecontrol","https://www.googleapis.com/auth/service.management.readonly","https://www.googleapis.com/auth/trace.append" --num-nodes "1" --enable-ip-alias --network "projects/lively-shelter-294615/global/networks/default" --subnetwork "projects/lively-shelter-294615/regions/europe-west8/subnetworks/default" --no-enable-intra-node-visibility --default-max-pods-per-node "110" --security-posture=standard --workload-vulnerability-scanning=disabled --no-enable-master-authorized-networks --addons HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver --enable-autoupgrade --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0 --binauthz-evaluation-mode=DISABLED --no-enable-managed-prometheus --enable-shielded-nodes --node-locations "europe-west8-a","europe-west8-c"