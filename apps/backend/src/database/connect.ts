import mongoose from 'mongoose';
import { config } from '../config';

export const connectDatabase = async (): Promise<void> => {
  try {
    const maskedUri = config.mongodb.uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to primary MongoDB at ${maskedUri}...`);
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to primary MongoDB successfully.');
  } catch (primaryErr: any) {
    console.error(`❌ Failed to connect to primary MongoDB (${primaryErr?.message || 'unknown error'}).`);
    if (config.env === 'production') {
      process.exit(1);
    }
  }
};


