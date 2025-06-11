**Notes**:
- Requests per second declare the affinity between the microservices. Services with higher RPS values indicate a higher volume of incoming requests, suggesting their increased significance for deployment.

- if all the pods are stressed, then apply scaling, otherwise apply traffic distribution.

- cluster autoscaler just scale up/down a service.
  TrafOptScheduler: scale up/scale down with scheduling to the best suited Node. Apply traffic distribution instead of scaling if not all the replica pods are streesed.

- optTraffic 