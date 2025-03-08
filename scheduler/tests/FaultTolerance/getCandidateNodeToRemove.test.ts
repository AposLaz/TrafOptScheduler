/** 
 * Scenario 5: All zones have exactly one replica
Input: Each zone has exactly one replica.
Expected Output: The function should return the most loaded node from any zone.
Scenario 6: One zone has the highest replica count
Input: One or more zones have more replicas than others.
Expected Output: The most loaded node from the most populated zone should be selected.
Scenario 7: No zones have sufficient replicas to remove
Input: All zones have only one node with replicas.
Expected Output: The function should return the most loaded node.

*/
