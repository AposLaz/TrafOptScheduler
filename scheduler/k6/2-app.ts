import http from 'k6/http';
import { check } from 'k6';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  stages: [
    { duration: '3m', target: 65 }, // ramp up to 40 VUs
    { duration: '5m', target: 70 }, // stay at 50 VUs
    { duration: '5m', target: 70 }, // ramp down to 60
    { duration: '15m', target: 75 }, // ramp down to 60
    { duration: '5m', target: 0 }, // ramp down to 0
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
  'http://a4cf0163a88414d71bac00143ce3321f-390210130.eu-central-1.elb.amazonaws.com',
];

export default function () {
  const target = randomItem(BASE_URLS);
  check(http.get(`${target}`), { 'status 200': (r) => r.status === 200 });
}
