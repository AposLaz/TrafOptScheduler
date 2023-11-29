# export PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} \
#     --format="value(projectNumber)")
export PROJECT_ID=$(gcloud config get-value project)

export CLUSTER_NAME_1="cluster-0"
export CLUSTER_ZONE_1="europe-west3-a"
export CTX_1="gke_${PROJECT_ID}_${CLUSTER_ZONE_1}_${CLUSTER_NAME_1}"

export CLUSTER_NAME_2="cluster-1"
export CLUSTER_ZONE_2="europe-west8-a"
export CTX_2="gke_${PROJECT_ID}_${CLUSTER_ZONE_2}_${CLUSTER_NAME_2}"

export ASM_VERSION="$(./asmcli --version)"

export REVISION="$(kubectl get deploy -n istio-system -l app=istiod -o jsonpath={.items[*].metadata.labels.'istio\.io\/rev'}'{"\n"}')"
################################################################################################ ONLINE BOUTIQUE


for CTX in ${CTX_1} ${CTX_2}
do
    echo "*********** Install Namespaces for ${CTX} *****************"
    kubectl apply --context=${CTX} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/namespaces
done;


echo "*********** Install Deployments for ${CTX_1} *****************"
kubectl apply --context=${CTX_1} -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/deployments/cluster-0

echo "*********** Install Deployments for ${CTX_2} *****************"
kubectl apply --context=${CTX_2} -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/deployments/cluster-1

sleep 10

for CTX in ${CTX_1} ${CTX_2}
do
    echo "*********** Install Services for ${CTX} *****************"
    kubectl apply --context=${CTX} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/services

    echo "*********** Install ISTIO EGRESS for ${CTX} *****************"
    kubectl apply --context=${CTX} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/istio-manifests/allow-egress-googleapis.yaml
    
    echo "*********** Add istio injection for pods for ${CTX} ***********"
      kubectl --context=${CTX} label namespace online-boutique istio-injection=enabled istio.io/rev=${REVISION} --overwrite
    
    echo "*********** Rollout pods for ${CTX} ***********"
      kubectl --context=${CTX} rollout restart deployment -n online-boutique
done;

sleep 10

kubectl apply --context=${CTX_1} -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/istio-manifests/frontend-gateway.yaml

sleep 2

echo "******************* ADD VERSIONS FOR EVERY CLUSTER *******************"

sleep 10

kubectl delete --context=${CTX_1} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/virtual-svc/ -n online-boutique
        
kubectl apply --context=${CTX_1} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/virtual-svc/ -n online-boutique

