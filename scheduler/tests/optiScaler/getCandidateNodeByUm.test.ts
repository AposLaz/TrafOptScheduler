describe('OptiScaler => getCandidateNodeByUm', () => {});

/**
 * Scenario 1: One Upstream Replica pod on different Node than the OptiScaler Node
 * Description: The loaded pod node will be the Node2 which will have 1 replica pod of the frontend.
 *              The Upstream replica pod will be located on Node1.
 *              The Node1 will have available resources to add a replica pod of the frontend.
 * Expected Output: The new replica pod should be created on the Node1
 */

describe('One upstream pod on a different node', () => {});

/**
 * Scenario 2: Two Upstream Replica pods on different Node than the OptiScaler Node
 * Description: The loaded pod node will be the Node2 which will have 1 replica pod of the frontend.
 *              The Upstream replica pod will be located on Node1, Node2, Node3.
 *              The Node1, Node2, Node3 will have available resources to add a replica pod of the frontend.
 * Expected Output: The new replica pod should be created on the Node1. Node1 -> Node2 have lower latency than the Node3 -> Node2
 */

describe('Multi-upstream with latency-based preference', () => {});

/**
 * Scenario 3: 5 Upstream Replica pods
 * Description: The loaded pod node will be the Node2 which will have 1 replica pod of the frontend.
 *              The Upstream replica pods will be located on Node1 (1 rs), Node2 (1 rs), Node3 (3 rs).
 *              The Node1, Node2, Node3 will have available resources to add a replica pod of the frontend.
 * Expected Output: The new replica pod should be created on the Node3. Node1 -> Node2 have lower latency than the Node3 -> Node2
 *                  but Node3 have more rps than Node1.
 */

describe('Upstream count and latency tradeoff', () => {});

/**
 * Scenario 4: 7 Upstream Replica pods.
 * Description: The loaded pod node will be the Node2 which will have 3 distributed replica pod of the frontend.
 *              The Upstream replica pods will be located on Node1 (1 rs), Node2 (3 rs), Node3 (3 rs).
 *              The Node1, Node2, Node3 will have available resources to add a replica pod of the frontend.
 * Expected Output: The new replica pod should be created on the Node1. Node1 -> Node2 have lower latency than the Node3 -> Node2
 *                  but Node3 have more rps than Node1 (no much higher).
 */

describe('Replica saturation across nodes', () => {});

// 5. Upstream nodes with no latency data:
// Simulate nodes that are upstream but don’t have corresponding entries in nodesLatency.

// Useful for testing robustness in:

// ts
// Copy
// Edit
// if (!latency) { ... }
// 📌 Expected: fallback to latency: 0 or LFU.

// 6. Nodes with no upstream RPS but are eligible
// Add a test where one of the candidate nodes is not present in the upstream graph (maybe a newer node just added).

// 📌 Expected: Test fallback to LFU or default scoring.

// 7. High number of upstream nodes (>3–5)
// You cover 5 and 7 in existing cases, but a really high count (e.g., 10 nodes, mixed RPS/latency) could test the sorting and weighting logic under complexity.

// 8. Equal weights:
// Scenario where latency and RPS weights lead to a tie.

// 📌 Expected: Check whether sort is stable or fallback logic is applied (like Math.random() or consistent fallback to LFU).
