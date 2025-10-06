2 upstream deployments

nodes:
aplaz: ip-192-168-171-197.eu-central-1.compute.internal
aplaz-proxy-1: ip-192-168-171-197.eu-central-1.compute.internal
aplaz-proxy-2: ip-192-168-112-152.eu-central-1.compute.internal

(HPA TESTS)

| Pod Name              | Node                                             | Age   |
| --------------------- | ------------------------------------------------ | ----- |
| aplaz-d875d8d5d-h57nl | ip-192-168-171-197.eu-central-1.compute.internal | 43m   |
| aplaz-d875d8d5d-hb844 | ip-192-168-148-119.eu-central-1.compute.internal | 8m12s |
| aplaz-d875d8d5d-nrkdl | ip-192-168-112-152.eu-central-1.compute.internal | 9m12s |
| aplaz-d875d8d5d-rknvw | ip-192-168-171-197.eu-central-1.compute.internal | 7m11s |

| Pod Name                      | Node                                             | Age   |
| ----------------------------- | ------------------------------------------------ | ----- |
| aplaz-proxy-1-dc8dfb565-8sxwl | ip-192-168-148-119.eu-central-1.compute.internal | 8m12s |
| aplaz-proxy-1-dc8dfb565-k7vwd | ip-192-168-112-152.eu-central-1.compute.internal | 7m11s |
| aplaz-proxy-1-dc8dfb565-w4bbh | ip-192-168-171-197.eu-central-1.compute.internal | 43m   |
| aplaz-proxy-1-dc8dfb565-wcssj | ip-192-168-112-152.eu-central-1.compute.internal | 9m12s |

| Pod Name                       | Node                                             | Age   |
| ------------------------------ | ------------------------------------------------ | ----- |
| aplaz-proxy-2-68978758f4-5r2hv | ip-192-168-112-152.eu-central-1.compute.internal | 9m12s |
| aplaz-proxy-2-68978758f4-6mvb8 | ip-192-168-112-152.eu-central-1.compute.internal | 8m12s |
| aplaz-proxy-2-68978758f4-hblj2 | ip-192-168-171-197.eu-central-1.compute.internal | 43m   |
| aplaz-proxy-2-68978758f4-zpbq9 | ip-192-168-112-152.eu-central-1.compute.internal | 7m11s |

3 minutes by the end the list is



| Source Pod                      | Destination Pod               | Source Node              | Destination Node          | RPS | Latency (ms) | Req/s   | Resp/s  |
|--------------------------------|-------------------------------|--------------------------|---------------------------|-----|---------------|---------|---------|
| aplaz-proxy-1-dc8dfb565-8sxwl  | aplaz-d875d8d5d-ggk2x         | ip-192-168-148-119       | ip-192-168-112-152        | 100 | 40            | 30 KiB  | 60 KiB  |
| aplaz-proxy-1-dc8dfb565-hsdml  | aplaz-d875d8d5d-h57nl         | ip-192-168-112-152       | ip-192-168-171-197        | 105 | 42            | 31 KiB  | 61 KiB  |
| aplaz-proxy-1-dc8dfb565-k7vwd  | aplaz-d875d8d5d-hb844         | ip-192-168-112-152       | ip-192-168-148-119        | 110 | 44            | 32 KiB  | 62 KiB  |
| aplaz-proxy-1-dc8dfb565-prxp9  | aplaz-d875d8d5d-nrkdl         | ip-192-168-171-197       | ip-192-168-112-152        | 115 | 46            | 33 KiB  | 63 KiB  |
| aplaz-proxy-1-dc8dfb565-w4bbh  | aplaz-d875d8d5d-x52zj         | ip-192-168-171-197       | ip-192-168-171-197        | 120 | 48            | 34 KiB  | 64 KiB  |
| aplaz-proxy-1-dc8dfb565-wcssj  | aplaz-d875d8d5d-ggk2x         | ip-192-168-112-152       | ip-192-168-112-152        | 125 | 50            | 35 KiB  | 65 KiB  |
| aplaz-proxy-2-68978758f4-6mvb8 | aplaz-d875d8d5d-h57nl         | ip-192-168-171-197       | ip-192-168-171-197        | 130 | 52            | 36 KiB  | 66 KiB  |
| aplaz-proxy-2-68978758f4-8g462 | aplaz-d875d8d5d-hb844         | ip-192-168-171-197       | ip-192-168-148-119        | 135 | 54            | 37 KiB  | 67 KiB  |
| aplaz-proxy-2-68978758f4-ndkwh | aplaz-d875d8d5d-nrkdl         | ip-192-168-112-152       | ip-192-168-112-152        | 140 | 56            | 38 KiB  | 68 KiB  |
| aplaz-proxy-2-68978758f4-pzdwm | aplaz-d875d8d5d-x52zj         | ip-192-168-112-152       | ip-192-168-171-197        | 145 | 58            | 39 KiB  | 69 KiB  |
| aplaz-proxy-2-68978758f4-zpbq9 | aplaz-d875d8d5d-ggk2x         | ip-192-168-112-152       | ip-192-168-112-152        | 150 | 60            | 40 KiB  | 70 KiB  |


histogram_quantile(0.95, rate(istio_request_duration_milliseconds_bucket{
  reporter="source", 
  source_workload="aplaz-proxy-1", 
  destination_workload="aplaz", 
  namespace="2-app"
}[40m]))

to get the response time


-------------------------------------
# HPA
(4 replicas per deployment)

  █ TOTAL RESULTS

    checks_total.......................: 757008 630.38018/s
    checks_succeeded...................: 99.99% 756974 out of 757008
    checks_failed......................: 0.00%  34 out of 757008

    ✗ status 200
      ↳  99% — ✓ 756974 / ✗ 34

    HTTP
    http_req_duration.......................................................: avg=110.57ms min=34.17ms med=97.01ms max=7.99s p(95)=173.73ms p(99)=415.26ms p(99.99)=6.82s count=757008
      { expected_response:true }............................................: avg=110.57ms min=34.17ms med=97.01ms max=7.99s p(95)=173.73ms p(99)=415.26ms p(99.99)=6.82s count=756974
    http_req_failed.........................................................: 0.00%  34 out of 757008
    http_reqs...............................................................: 757008 630.38018/s

    EXECUTION
    iteration_duration......................................................: avg=110.94ms min=34.17ms med=97.29ms max=7.99s p(95)=174.16ms p(99)=416.12ms p(99.99)=6.86s count=757008
    iterations..............................................................: 757008 630.38018/s
    vus.....................................................................: 70     min=70           max=70
    vus_max.................................................................: 70     min=70           max=70

    NETWORK
    data_received...........................................................: 250 MB 208 kB/s
    data_sent...............................................................: 98 MB  82 kB/s




running (20m00.9s), 00/70 VUs, 757008 complete and 0 interrupted iterations
default ✓ [======================================] 70 VUs  20m0s
Done in 1204.50s.

# TRAF OPT SCHEDULER
