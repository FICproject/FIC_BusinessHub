import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../../config';

export interface StoragePutParams {
  key: string;
  body: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StorageGetResult {
  buffer: Buffer;
  contentType?: string;
}

export interface IStorageProvider {
  readonly providerName: 's3' | 'local';
  putObject(params: StoragePutParams): Promise<void>;
  getObjectBuffer(key: string): Promise<StorageGetResult>;
  getObjectStream(key: string): Promise<Readable>;
  deleteObject(key: string): Promise<void>;
  getSignedDownloadUrl?(
    key: string,
    expiresInSeconds?: number,
    options?: { fileName?: string; disposition?: 'inline' | 'attachment'; contentType?: string }
  ): Promise<string | null>;
}

/**
 * Normalizes a logical storage key and guards against directory traversal or null bytes.
 */
export function sanitizeStorageKey(rawKey: string): string {
  const normalized = rawKey.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('\0')) {
    throw new Error('Invalid storage key');
  }
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0 || parts.some((segment) => segment === '.' || segment === '..')) {
    throw new Error('Unsafe storage key path');
  }
  return parts.join('/');
}

/**
 * Private local filesystem storage kept outside static `/uploads` routes.
 */
export class LocalPrivateStorageProvider implements IStorageProvider {
  public readonly providerName = 'local' as const;
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = path.resolve(baseDir);
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  private resolveSafePath(rawKey: string): string {
    const safeKey = sanitizeStorageKey(rawKey);
    const resolved = path.resolve(this.baseDir, safeKey);
    const relative = path.relative(this.baseDir, resolved);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('Resolved path escapes private storage root');
    }
    return resolved;
  }

  async putObject(params: StoragePutParams): Promise<void> {
    const targetPath = this.resolveSafePath(params.key);
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, params.body, { mode: 0o600 });
  }

  async getObjectBuffer(key: string): Promise<StorageGetResult> {
    const targetPath = this.resolveSafePath(key);
    const buffer = await fs.promises.readFile(targetPath);
    return { buffer };
  }

  async getObjectStream(key: string): Promise<Readable> {
    const targetPath = this.resolveSafePath(key);
    await fs.promises.access(targetPath, fs.constants.R_OK);
    return fs.createReadStream(targetPath);
  }

  async deleteObject(key: string): Promise<void> {
    const targetPath = this.resolveSafePath(key);
    try {
      await fs.promises.unlink(targetPath);
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        throw err;
      }
    }
  }
}

/**
 * Private S3-compatible object storage (AWS S3 / Cloudflare R2 / Supabase Storage).
 */
export class S3CompatibleStorageProvider implements IStorageProvider {
  public readonly providerName = 's3' as const;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: {
    bucket: string;
    region: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    accessKeyId: string;
    secretAccessKey: string;
  }) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      region: options.region || 'auto',
      ...(options.endpoint ? { endpoint: options.endpoint } : {}),
      forcePathStyle: Boolean(options.forcePathStyle),
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey
      }
    });
  }

  async putObject(params: StoragePutParams): Promise<void> {
    const key = sanitizeStorageKey(params.key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.body,
        ContentType: params.contentType,
        Metadata: params.metadata
      })
    );
  }

  async getObjectBuffer(key: string): Promise<StorageGetResult> {
    const safeKey = sanitizeStorageKey(key);
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: safeKey
      })
    );
    if (!response.Body) {
      throw new Error('Empty S3 response body');
    }
    const bytes = await response.Body.transformToByteArray();
    return {
      buffer: Buffer.from(bytes),
      contentType: response.ContentType
    };
  }

  async getObjectStream(key: string): Promise<Readable> {
    const safeKey = sanitizeStorageKey(key);
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: safeKey
      })
    );
    if (!response.Body) {
      throw new Error('Empty S3 response body');
    }
    if (response.Body instanceof Readable) {
      return response.Body;
    }
    const bytes = await response.Body.transformToByteArray();
    return Readable.from(Buffer.from(bytes));
  }

  async deleteObject(key: string): Promise<void> {
    const safeKey = sanitizeStorageKey(key);
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: safeKey
      })
    );
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = config.storage.signedUrlTtlSeconds,
    options?: { fileName?: string; disposition?: 'inline' | 'attachment'; contentType?: string }
  ): Promise<string | null> {
    const safeKey = sanitizeStorageKey(key);
    const safeFileName = (options?.fileName || 'document').replace(/[\r\n"]/g, '_');
    const disposition = options?.disposition || 'attachment';
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: safeKey,
      ResponseContentDisposition: `${disposition}; filename="${safeFileName}"`,
      ...(options?.contentType ? { ResponseContentType: options.contentType } : {})
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}

export function createStorageProvider(override?: Partial<typeof config.storage>): IStorageProvider {
  const settings = { ...config.storage, ...override };
  if (
    settings.provider === 's3' &&
    settings.bucket &&
    settings.accessKeyId &&
    settings.secretAccessKey
  ) {
    return new S3CompatibleStorageProvider({
      bucket: settings.bucket,
      region: settings.region,
      endpoint: settings.endpoint || undefined,
      forcePathStyle: settings.forcePathStyle,
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey
    });
  }
  return new LocalPrivateStorageProvider(settings.localPrivateDir);
}

export const objectStorage: IStorageProvider = createStorageProvider();
