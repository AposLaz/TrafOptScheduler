/**
 * 
 * 
 * αν εχουμε 2 pods που επικοινωνούνε ποιο πολύ μεταξύ τους τότε θα αποφασίσουμε αυτά τα δύο pods να μην μετακινηθούν αλλά να μείνουν ως έχει 
 * ή να γίνει replicate
 * 1) να φτιάξουμε ένα multicluster
 * 2) To istio ή το anthos θα πρέπει να είναι multicluster  
 * 
 * 
 * 
This files is used for auto add IPs for prometheus, jaeger, grafana in kiali-values.yaml
 
Yaml in kiali
 
auth:
  strategy: anonymous

external_services:
  prometheus:
    url: http://35.198.91.111/prometheus                                //We want replace IP with the ip that GCP give to Load Balancer
    health_check_url: http://35.198.91.111/prometheus/-/healthy         //We want replace IP with the ip that GCP give to Load Balancer
  tracing:
    enabled: true
    in_cluster_url: http://tracing.istio-system/jaeger
    # TODO : change this to nginx ingress controller IP
    url: http://35.234.114.50                                           //We want replace IP with the ip that GCP give to Load Balancer
    use_grpc: false
  grafana:
    enabled: true
    in_cluster_url: http://prometheus-grafana.istio-system/grafana
    # TODO : change this to nginx ingress controller IP
    url: http://35.198.91.111/grafana                                   //We want replace IP with the ip that GCP give to Load Balancer
 */

//kubectl get ingress -n istio-system -o=jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}'

//first read yaml files for kiali-values
const yaml = require('js-yaml');
const fs   = require('fs');
const { exec } = require("child_process");

// Get document, or throw exception on error
const readYaml = async()=>{
    try {
        const jsonYaml = await yaml.load(fs.readFileSync('kiali-values.yaml', 'utf8'));
        return jsonYaml;
      } catch (e) {
        console.log(e);
        process.exit(1)
      }
}

const getIngressIPprometheus = async()=>{
    exec("kubectl get ingress -n istio-system -o=jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}'", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        return stdout;
    });
    
}

const getTracingIP = async()=>{

}

const main = async()=>{
    const doc = await readYaml();
    await getIngressIPprometheus(); 
}

main()

