when a replica pod is scale up or down, then get all the downstream replica pods of this pod, write to the file, so in the next run the OptiBalancer to update their traffic rules

"namespace" : {
"scaled up/down pod 1": ["its downstream pods"],
"scaled up/down pod 2": ["its downstream pods"]
}

The structure should be something like that

├── src
│ ├── adapters
│ │ ├── filesystem # Handles interactions with the file system
│ │ │ ├── filesystem.adapter.ts
│ │ │ ├── types.ts
│ │ ├── k8s # Interacts with Kubernetes API
│ │ │ ├── k8s.adapter.ts # Kubernetes API integration (only external communication)
│ │ │ ├── types.ts
│ │ ├── prometheus # Interacts with Prometheus API
│ │ │ ├── prometheus.adapter.ts
│ │ │ ├── types.ts
│ ├── core
│ │ ├── services # Business logic and internal application behavior
│ │ │ ├── deploy.service.ts
│ │ │ ├── metrics.service.ts
│ │ │ ├── optiBalancer.service.ts
│ │ │ ├── optiScaler.service.ts
│ │ │ ├── trafficScheduler.service.ts
│ │ ├── mappers # Handles data transformation between raw API responses and usable models
│ │ │ ├── k8s.mapper.ts
│ │ │ ├── prometheus.mapper.ts
│ │ │ ├── optiBalancer.mapper.ts
│ │ ├── strategies # Implements decision-making algorithms
│ │ │ ├── threshold.strategy.ts
│ │ │ ├── scaling.strategy.ts
│ │ ├── models # Type definitions and business domain models
│ │ │ ├── k8s.model.ts
│ │ │ ├── prometheus.model.ts
│ │ │ ├── traffic.model.ts
│ ├── config
│ │ ├── config.ts
│ │ ├── k8sClient.ts
│ │ ├── logger.ts
│ │ ├── setup.ts
│ ├── index.ts
│ ├── app.ts
│ └── utils.ts
