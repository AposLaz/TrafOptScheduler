// @ts-nocheck

import http from 'k6/http';
import { check, sleep } from 'k6';
import * as k6Utils from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const randomSeed = k6Utils.randomSeed;
const randomItem = k6Utils.randomItem;

export const options = {
  // A number specifying the number of VUs to run concurrently.
  vus: 800,
  // A string specifying the total duration of the test run.
  duration: '1h',

  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)', 'p(99.99)', 'count'],
};

// Use environment variable, fallback to localhost
const BASE_URL = `http://${__ENV.FRONTEND_ADDR || 'localhost:8888'}`;

const products = [
  '0PUK6V6EV0',
  '1YMWWN1N4O',
  '2ZYFJ3GM2N',
  '66VCHSJNUP',
  '6E92ZMYYFZ',
  '9SIQT8TOJO',
  'L9ECAV7KIM',
  'LS4PSXUNUM',
  'OLJCESPC7Z',
];

// Random mock data generators
function getRandomEmail() {
  return `user${Math.floor(Math.random() * 100000)}@example.com`;
}

function getRandomAddress() {
  return {
    street: `Street ${Math.floor(Math.random() * 1000)}`,
    zip: `${Math.floor(10000 + Math.random() * 89999)}`,
    city: `City${Math.floor(Math.random() * 100)}`,
    state: `ST`,
    country: `Country`,
  };
}

function getRandomCard() {
  return {
    number: `411111111111${Math.floor(1000 + Math.random() * 8999)}`,
    month: Math.floor(Math.random() * 12) + 1,
    year: new Date().getFullYear() + Math.floor(Math.random() * 10),
    cvv: `${Math.floor(100 + Math.random() * 900)}`,
  };
}

function setCurrency() {
  const currencies = ['EUR', 'USD', 'JPY', 'CAD', 'GBP', 'TRY'];
  const res = http.post(`${BASE_URL}/setCurrency`, { currency_code: randomItem(currencies) });
  check(res, { 'setCurrency status 200': (r) => r.status === 200 });
}

function browseProduct() {
  http.get(`${BASE_URL}/product/${randomItem(products)}`);
}

function addToCart() {
  const product = randomItem(products);
  http.get(`${BASE_URL}/product/${product}`);
  http.post(`${BASE_URL}/cart`, {
    product_id: product,
    quantity: Math.floor(Math.random() * 10) + 1,
  });
}

function viewCart() {
  http.get(`${BASE_URL}/cart`);
}

function checkout() {
  addToCart(); // Ensure there's something in the cart

  const address = getRandomAddress();
  const card = getRandomCard();

  http.post(`${BASE_URL}/cart/checkout`, {
    email: getRandomEmail(),
    street_address: address.street,
    zip_code: address.zip,
    city: address.city,
    state: address.state,
    country: address.country,
    credit_card_number: card.number,
    credit_card_expiration_month: card.month,
    credit_card_expiration_year: card.year,
    credit_card_cvv: card.cvv,
  });
}

function logout() {
  http.get(`${BASE_URL}/logout`);
}

export default function () {
  check(http.get(`${BASE_URL}/`), { 'home status 200': (r) => r.status === 200 });

  setCurrency();
  browseProduct();
  addToCart();
  viewCart();
  checkout();

  sleep(Math.random() * 9 + 1); // between(1, 10)
}
