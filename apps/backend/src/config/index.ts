import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
if (!process.env.MONGODB_URI && !process.env.JWT_ACCESS_SECRET) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fic_business_hub'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_access_secret_change_in_production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    documentSigningSecret:
      process.env.DOCUMENT_SIGNING_SECRET ||
      process.env.JWT_ACCESS_SECRET ||
      'default_document_signing_secret_change_in_production'
  },
  cors: {
    allowedOrigins: [
      ...(process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : []),
      process.env.WEB_ORIGIN || 'http://localhost:5173',
      process.env.ADMIN_ORIGIN || 'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:3001',
      'http://localhost:3000'
    ].filter(Boolean)
  },
  razorpay: {
    keyId: (process.env.RAZORPAY_KEY_ID || '').trim(),
    keySecret: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
    webhookSecret: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
    allowLiveKeys: process.env.RAZORPAY_ALLOW_LIVE === 'true'
  },
  storage: {
    provider: ((process.env.OBJECT_STORAGE_PROVIDER || (process.env.OBJECT_STORAGE_BUCKET ? 's3' : 'local')).toLowerCase() === 's3'
      ? 's3'
      : 'local') as 's3' | 'local',
    bucket: (process.env.OBJECT_STORAGE_BUCKET || '').trim(),
    region: (process.env.OBJECT_STORAGE_REGION || 'auto').trim(),
    endpoint: (process.env.OBJECT_STORAGE_ENDPOINT || '').trim(),
    forcePathStyle: process.env.OBJECT_STORAGE_FORCE_PATH_STYLE === 'true',
    accessKeyId: (process.env.OBJECT_STORAGE_ACCESS_KEY || '').trim(),
    secretAccessKey: (process.env.OBJECT_STORAGE_SECRET_KEY || '').trim(),
    localPrivateDir: process.env.LOCAL_PRIVATE_STORAGE_DIR
      ? path.resolve(process.env.LOCAL_PRIVATE_STORAGE_DIR)
      : path.resolve(__dirname, '../../storage/private'),
    signedUrlTtlSeconds: parseInt(process.env.DOCUMENT_SIGNED_URL_TTL_SECONDS || '300', 10),
    maxUploadBytes: parseInt(process.env.DOCUMENT_MAX_UPLOAD_BYTES || String(15 * 1024 * 1024), 10)
  }
};


