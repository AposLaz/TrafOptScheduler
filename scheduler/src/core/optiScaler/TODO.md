when a replica pod is scale up or down, then get all the downstream replica pods of this pod, write to the file, so in the next run the OptiBalancer to update their traffic rules

"namespace" : {
  "scaled up/down pod 1": ["its downstream pods"],
  "scaled up/down pod 2": ["its downstream pods"]
}
