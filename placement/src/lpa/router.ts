import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
  const body = req.body;
  console.log(body);
  res.send('ok POST');
});

router.get('/', (req, res) => {
  const body = req.body;
  console.log(body);
  res.send('ok GET');
});

export default router;
