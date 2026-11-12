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
    // Drop legacy non-sparse unique memberId_1 index left on memberwallets
    // when AdminMemberWallet moved to the adminmemberwallets collection.
    try {
      const mwCollection = mongoose.connection.collection('memberwallets');
      const indexes = await mwCollection.indexes();
      const legacyMemberIdIdx = indexes.find(
        (idx: any) => idx.name === 'memberId_1' && idx.unique && !idx.sparse
      );
      if (legacyMemberIdIdx) {
        await mwCollection.dropIndex('memberId_1');
        console.log('ℹ️ Dropped legacy non-sparse memberwallets.memberId_1 index.');
      }
    } catch {
      // Ignore if collection does not exist yet
    }
  } catch (primaryErr: any) {
    console.error(`❌ Failed to connect to primary MongoDB (${primaryErr?.message || 'unknown error'}).`);
    if (config.env === 'production') {
      process.exit(1);
    }
  }
};


