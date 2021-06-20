import express, { Request, Response } from 'express';
import register from '../helpers/MetricsRegistry';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

export default router;
