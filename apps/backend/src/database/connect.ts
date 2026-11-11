import mongoose from 'mongoose';
import { config } from '../config';

export const connectDatabase = async (): Promise<void> => {
  let connected = false;

  // 1. Attempt connection with configured MongoDB URI
  try {
    const maskedUri = config.mongodb.uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to primary MongoDB at ${maskedUri}...`);
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to primary MongoDB successfully.');
    connected = true;
  } catch (primaryErr: any) {
    console.warn(`⚠️ Primary MongoDB connection failed (${primaryErr?.message || 'unknown error'}).`);
    console.warn('Initializing embedded database fallback so the app functions seamlessly...');
  }

  // 2. Persistent local MongoDB fallback if configured Atlas DB auth fails or is unreachable
  if (!connected) {
    try {
      const path = await import('path');
      const fs = await import('fs');
      const { MongoMemoryServer } = await import('mongodb-memory-server');

      // Store data on local disk in d:\HubProject\backend\data\db so data is preserved across server restarts
      const persistentDbPath = path.resolve(process.cwd(), 'data', 'db');
      if (!fs.existsSync(persistentDbPath)) {
        fs.mkdirSync(persistentDbPath, { recursive: true });
      }

      console.log(`Starting persistent local embedded MongoDB database at: ${persistentDbPath}...`);
      const mongod = await MongoMemoryServer.create({
        instance: {
          dbPath: persistentDbPath,
          storageEngine: 'wiredTiger',
        },
      });

      const embeddedUri = mongod.getUri();
      console.log(`Persistent MongoDB service started at: ${embeddedUri}`);

      await mongoose.connect(embeddedUri);
      console.log('✅ Connected to persistent database successfully. All accounts, KYC, and categories will persist across restarts.');
      connected = true;
    } catch (memErr) {
      console.error('❌ Failed to start persistent fallback MongoDB:', memErr);
      if (config.env === 'production') {
        process.exit(1);
      }
    }
  }
};


