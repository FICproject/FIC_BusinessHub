import { createApp } from './app';
import { config } from './config';
import { connectDatabase } from './database/connect';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`🚀 FIC Business Hub API listening on port ${config.port} [${config.env}]`);
  });

  const shutdown = () => {
    console.log('Shutting down API server gracefully...');
    server.close(() => {
      console.log('API server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});

