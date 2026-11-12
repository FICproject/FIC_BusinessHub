import sharp from 'sharp';
import { ValidatedFileInfo } from './file-validator';

export interface OptimizedDerivativeResult {
  previewBuffer?: Buffer;
  previewMimeType?: string;
  previewFileSize?: number;
  previewExtension?: string;
  thumbnailBuffer?: Buffer;
  thumbnailMimeType?: string;
  thumbnailFileSize?: number;
  thumbnailExtension?: string;
  compressionRatio?: number;
}

/**
 * Generates WebP preview and thumbnail buffers for images without mutating the original buffer.
 * PDF, Office, and TXT files preserve the exact original without artificial re-encoding.
 */
export async function generateOptimizedDerivatives(
  originalBuffer: Buffer,
  fileInfo: ValidatedFileInfo
): Promise<OptimizedDerivativeResult> {
  if (!fileInfo.isImage) {
    return {};
  }

  // Re-create sharp pipelines from read-only originalBuffer; never overwrite originalBuffer.
  const previewBuffer = await sharp(originalBuffer, {
    failOn: 'error',
    limitInputPixels: 40_000_000
  })
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({
      quality: 76,
      effort: 4
    })
    .toBuffer();

  const thumbnailBuffer = await sharp(originalBuffer, {
    failOn: 'error',
    limitInputPixels: 40_000_000
  })
    .rotate()
    .resize({
      width: 320,
      height: 320,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({
      quality: 68,
      effort: 4
    })
    .toBuffer();

  const savedRatio =
    originalBuffer.length > 0
      ? Number((((originalBuffer.length - previewBuffer.length) / originalBuffer.length) * 100).toFixed(2))
      : 0;

  return {
    previewBuffer,
    previewMimeType: 'image/webp',
    previewFileSize: previewBuffer.length,
    previewExtension: 'webp',
    thumbnailBuffer,
    thumbnailMimeType: 'image/webp',
    thumbnailFileSize: thumbnailBuffer.length,
    thumbnailExtension: 'webp',
    compressionRatio: savedRatio
  };
}

