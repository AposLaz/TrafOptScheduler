import express, { Express } from 'express';
import cors from 'cors';
import lpaRouter from './lpa/router';

const app: Express = express();

// health check
app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.use(cors());
app.use(express.json());

app.use('/api/v1/lpa', lpaRouter);

//TODO add error handler

export { app };
