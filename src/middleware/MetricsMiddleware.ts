import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import register from '../helpers/MetricsRegistry';

const counter = new client.Counter({
  name: 'http_requests_count',
  help: 'Total number of http requests',
  labelNames: ['method', 'originalUrl', 'statusCode'],
});

register.registerMetric(counter);

const MetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    console.log(req.headers);
    counter.labels(req.method, req.originalUrl, `${res.statusCode}`).inc();
  });
  next();
};

export default MetricsMiddleware;
