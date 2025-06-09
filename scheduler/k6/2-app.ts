import http from 'k6/http';
import { check } from 'k6';

export const options = {
  // A number specifying the number of VUs to run concurrently.
  vus: 45,
  // A string specifying the total duration of the test run.
  duration: '10m',

  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)', 'p(99.99)', 'count'],
};

// Use environment variable, fallback to localhost
const BASE_URL = `http://${__ENV.HELLO_PROXY_ADDR || 'localhost:3050'}`;

export default function () {
  check(http.get(`${BASE_URL}/`), { 'status 200': (r) => r.status === 200 });
}
