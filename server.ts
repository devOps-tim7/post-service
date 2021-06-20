require('express-async-errors');
import express from 'express';
import cors from 'cors';
import errorHandler from './src/middleware/ErrorHandler';
import PostRoutes from './src/routes/Post';
import UserRoutes from './src/routes/User';
import RelationRoutes from './src/routes/Relation';
import metricsMiddleware from './src/middleware/MetricsMiddleware';
import MetricsRoutes from './src/routes/Metrics';

export const createServer = () => {
  const app = express();
  app.use(express.json({ limit: '8mb' }));
  app.use(cors());
  app.use(metricsMiddleware);
  app.use('/metrics', MetricsRoutes);
  app.use('/api/posts/user', UserRoutes);
  app.use('/api/posts/relation', RelationRoutes);
  app.use('/api/posts', PostRoutes);
  app.use(errorHandler);
  return app;
};
