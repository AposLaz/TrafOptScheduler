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

export REVISION=kubectl get deploy -n istio-system -l app=istiod -o jsonpath={.items[*].metadata.labels.'istio\.io\/rev'}'{"\n"}'
# export HELLO_WORLD_DIR=./asm_output/istio-${ASM_VERSION%+*}

# echo ""
# export ASM_VERSION="$(./asmcli --version)"
# export HELLO_WORLD_DIR=./asm_output/istio-${ASM_VERSION%+*}

################################################################################################ ONLINE BOUTIQUE


for CTX in ${CTX_1} ${CTX_2}
do
    echo "*********** Install Namespaces for ${CTX} *****************"
    kubectl apply --context=${CTX} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/namespaces
done


echo "*********** Install Deployments for ${CTX} *****************"
kubectl apply --context=${CTX_1} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/deployments/cluster-0

kubectl apply --context=${CTX_2} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/deployments/cluster-1

sleep 3
for CTX in ${CTX_1} ${CTX_2}
do
    echo "*********** Install Services for ${CTX} *****************"
    kubectl apply --context=${CTX} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/services
done

for CTX in ${CTX_1} ${CTX_2}
do
    echo "*********** Install ISTIO EGRESS for ${CTX} *****************"
    kubectl apply --context=${CTX} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/istio-manifests/allow-egress-googleapis.yaml
done

for CTX in ${CTX_1} ${CTX_2}
do
  echo "*********** Add istio injection for pods for ${CTX} ***********"
  for ns in ad cart checkout currency email frontend loadgenerator \
    payment productcatalog recommendation shipping; do
      kubectl --context=${CTX} label namespace $ns istio-injection=enabled istio.io/rev=${REVISION} --overwrite
  done
done;

for CTX in ${CTX_1} ${CTX_2}
do
  echo "*********** Rollout pods for ${CTX} ***********"
  for ns in ad cart checkout currency email frontend loadgenerator \
    payment productcatalog recommendation shipping; do
      kubectl rollout restart deployment -n ${ns}
  done;
done;

kubectl apply --context=${CTX_1} -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/istio-manifests/frontend-gateway.yaml

sleep 2

echo "******************* ADD VERSIONS FOR EVERY CLUSTER *******************"

sleep 2
WORDTOREMOVE="service"
NS=${deploy//$WORDTOREMOVE/}

for deploy in adservice cartservice checkoutservice currencyservice emailservice frontend loadgenerator \
    paymentservice productcatalogservice recommendationservice shippingservice; do
      NS=${deploy/%"$WORDTOREMOVE"}
      kubectl delete --context=${CTX_1} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/virtual-svc/${deploy}.yaml -n $NS
      kubectl apply --context=${CTX_1} \
        -f ./kubernetes-cluster/multicluster-gke/apps/online-boutique/kubernetes-manifests/virtual-svc/${deploy}.yaml -n $NS
done;


