import express, { Express } from 'express';
import cors from 'cors';

const app: Express = express();

// health check
app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.use(cors());
app.use(express.json());

export { app };
