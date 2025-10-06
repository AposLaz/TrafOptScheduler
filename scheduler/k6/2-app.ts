import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  // vus: 700, // 80 is the right number
  // duration: '20m',

  stages: [
    { duration: '1m', target: 100 }, // Ramp up to 20 VUs
    { duration: '30m', target: 200 }, // Increase to 50 VUs
    // { duration: '3m', target: 300 }, // Peak load
    // { duration: '3m', target: 400 }, // Ramp down
    // { duration: '3m', target: 500 }, // Ramp down
    // { duration: '5m', target: 500 }, // Ramp down
    // { duration: '5m', target: 600 }, // Ramp down
    // { duration: '5m', target: 700 }, // Ramp down
    // { duration: '5m', target: 600 }, // Ramp down
    // { duration: '5m', target: 500 }, // Ramp down
    // { duration: '3m', target: 300 }, // Ramp down
    // { duration: '2m', target: 200 }, // Ramp down
    // { duration: '2m', target: 0 }, // Ramp down
  ],

  // A number specifying the number of VUs to run concurrently.
  // vus: 40,
  // // A string specifying the total duration of the test run.
  // duration: '20m',

  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)', 'p(99.99)', 'count'],
};

// Use environment variable, fallback to localhost
const BASE_URLS = [
  'http://ae3c8548ea22c47b5b82c6b0f6fdaa7c-1015177939.eu-central-1.elb.amazonaws.com',
  'http://a4cf0163a88414d71bac00143ce3321f-157460035.eu-central-1.elb.amazonaws.com',
];

export default function () {
  const target = randomItem(BASE_URLS);
  check(http.get(`${target}`), { 'status 200': (r) => r.status === 200 });
  sleep(0.1);
}
