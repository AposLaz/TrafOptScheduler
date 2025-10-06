Scenario - 1
---------
Using the all TrafOptScheduler (Not only the optibalancer)

2 Upstreams (aplaz-proxy)

1 Downstream (aplaz)
---------

- trafOptScheduler

7 replicas of aplaz

- hpa

10 replicas of aplaz (disadvantage - use the requests instead of limits. The nodes may not have resources - its is not trustable )

-----
same response time for the aplaz

--------------------------------------
Scenario-2
----------
Using the optiBalancer

2 Upstreams (aplaz-proxy)

5 Downstream (aplaz) (split in each node each one)
---------------
- OptiBalancer

cross node 95th percentile = response time: 788ms (1pod in this node)
cross node 99th percentile = response time: 1.4s (1pod in this node)

inter-node communication 95th percentile = 65ms (2 pods per node)
inter-node communication 95th percentile = 110ms (2 pods per node)

- Kubernetes Native

459 rps

95th percentile = response time: 383ms

99th percentile =  response time: 477ms
------------
Scenario-3
----------
Using the optiBalancer

2 Upstreams (aplaz-proxy)

3 Downstream (aplaz) (split in each node each one)
---------------
- OptiBalancer

cross node 95th percentile = response time: 41ms
cross node 99th percentile = response time: 200ms

inter-node communication 95th percentile = 2s
inter-node communication 99th percentile = 2.8s

- Kubernetes Native

459 rps

95th percentile = response time: 820ms

99th percentile =  response time: 963ms

------------
Scenario-3
----------
Using the optiBalancer

2 Upstreams (aplaz-proxy)

3 Downstream (aplaz) (split in each node each one)
---------------
- OptiBalancer

cross node 95th percentile = response time: 41ms
cross node 99th percentile = response time: 200ms

inter-node communication 95th percentile = 2s
inter-node communication 99th percentile = 2.8s

- Kubernetes Native

459 rps

95th percentile = response time: 820ms

99th percentile =  response time: 963ms