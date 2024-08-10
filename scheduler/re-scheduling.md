# Scope

Reschedule a pod to a specific node

apply a node of type

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pong-server-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: pong-server
  template:
    metadata:
      labels:
        app: pong-server
    spec:
      containers:
      - name: pong-server
        image:  ghcr.io/s1ntaxe770r/pong:e0fb83f27536836d1420cffd0724360a7a650c13
        ports:
        - containerPort: 8080
```

With one replica pod

# Schedule pod in a specific NODE

I want then apply a new replica pod but to schedule it in a specific node
I can achieve that with taint in nodes. 

Apply taint on all nodes except this one that want the resceduling to happening.

`kubectl taint nodes node1 key1=value1:NoSchedule`

If a pod reach its highest value of resources it will be terminated and after will be created again. 
This not guarantee that this pod will start in the same not as before. That's why after the restart, scheduler will execute. 

after rescheduling delete taint for the nodes

all other deployment with this not name will have a toleration for this specific name

for exemple lets say that we have 2 deployments:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pong-server-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: pong-server
  template:
    metadata:
      labels:
        app: pong-server
    spec:
      containers:
      - name: pong-server
        image:  ghcr.io/s1ntaxe770r/pong:e0fb83f27536836d1420cffd0724360a7a650c13
        ports:
        - containerPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: server-app-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: server-app
  template:
    metadata:
      labels:
        app: server-app
    spec:
      containers:
      - name: server-app
        image:  ghcr.io/s1ntaxe770r/pong:e0fb83f27536836d1420cffd0724360a7a650c13
        ports:
        - containerPort: 8080
```

if the 2 deployments have to rescheduling the pod `pong` in node1 and pod `server` in node 2.

Then apply taint for `pong` in node2 and taint for pod in `server` in node 1.

Ex.
```bash
# server pod must be scheduled in node2 so add taint in node2
kubectl taint nodes node1 server-app-deployment:NoSchedule
# pong pod must be scheduled in node1 so add taint in node2
kubectl taint nodes node2 pong-server-deployment:NoSchedule
```

after that we have to add tolerations for each deployment. Tolerations will be applied for tolerate taint for the other deployments.
For example `pong` pod must tolerate `server node taint` and `server` pod must tolerate `pong node taint`.

!!!**ADDING AND REMOVE TOLERATIONS MAKE PODS TO BE RESCHEDULED AND RECREATE**!!!
<s>add tolerations = `kubectl patch deployment deploy-name -p '{"spec":{"template":{"spec":{"tolerations":[{"key":"key","operator":"Equal","value":"value","effect":"NoSchedule"}]}}}}'`</s>


delete taints: `kubectl taint nodes node1 key-`

after all of that delete the node that must be deleted and reduce replicas simultaneously

`kubectl scale deployment pong-server-deployment --replicas=1 && kubectl delete pod pong-server-deployment-69d87f5567-9dt5n`