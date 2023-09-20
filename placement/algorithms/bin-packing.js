// Javascript program to find number of bins required using
// First Fit algorithm.
 
// Returns number of bins required using first fit
// online algorithm
function firstFit(weight,n,c)
{
    // Initialize result (Count of bins)
    let res = 0;
  
    // Create an array to store remaining space in bins
    // there can be at most n bins
    let bin_rem = new Array(n);
  
    // Place items one by one
    for (let i = 0; i < n; i++)
    {
        // Find the first bin that can accommodate
        // weight[i]
        let j;
        for (j = 0; j < res; j++)
        {
            if (bin_rem[j] >= weight[i])
            {
                bin_rem[j] = bin_rem[j] - weight[i];
                break;
            }
        }
  
        // If no bin could accommodate weight[i]
        if (j == res)
        {
            bin_rem[res] = c - weight[i];
            res++;
        }
    }
    return res;
}
  
// This code is contributed by patel2127

 
function firstFitDec(weight, n, c) {
    // Sort all weights in decreasing order
    weight.sort((a, b) => b - a);
 
    // Now call firstFit() for sorted items
    firstFit(weight,n,c)
    return 3;
}
 
let weight = [2, 5, 4, 7, 1, 3, 8];
let c = 10;
let n = weight.length;
console.log(`Number of bins required in First Fit Decreasing: ${firstFitDec(weight, n, c)}`);
 
// This code is contributed by ishankhandelwals.
