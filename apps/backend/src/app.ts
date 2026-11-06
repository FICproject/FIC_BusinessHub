import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { apiRouter } from './routes';
import { adminRouter } from './modules/admin';
import { errorHandler } from './common/middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // Ensure uploads directory structure exists
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const videosDir = path.join(uploadsDir, 'videos');
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
  if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

  // Security & standard middleware with cross-origin media support
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(
    cors({
      origin: config.cors.allowedOrigins,
      credentials: true
    })
  );
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve static uploaded files (videos, thumbnails)
  app.use('/uploads', express.static(uploadsDir));

  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Member API Routes
  app.use('/api/v1', apiRouter);

  // Consolidated Admin API Routes (accessible via /api/admin or /api/v1/admin)
  app.use('/api/admin', adminRouter);
  app.use('/api/v1/admin', adminRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
