import crypto from 'crypto';
import path from 'path';
import { config } from '../../config';
import { AppError } from '../../common/errors/app-error';

export type SupportedExtension =
  | 'pdf'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'doc'
  | 'docx'
  | 'xls'
  | 'xlsx'
  | 'ppt'
  | 'pptx'
  | 'txt';

export interface ValidatedFileInfo {
  safeOriginalFileName: string;
  extension: SupportedExtension;
  detectedMimeType: string;
  fileSize: number;
  checksumSha256: string;
  isImage: boolean;
  isText: boolean;
  isPdf: boolean;
}

const EXTENSION_MIME_MAP: Record<SupportedExtension, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain'
};

const BLOCKED_SCRIPT_OR_EXECUTABLE_PREFIXES: Array<Buffer> = [
  Buffer.from([0x4d, 0x5a]), // Windows PE/EXE/DLL (MZ)
  Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // Linux ELF
  Buffer.from([0xca, 0xfe, 0xba, 0xbe]), // Mach-O / Java class
  Buffer.from('#!') // Shell / interpreter script
];

const OLE2_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

function startsWithBytes(buf: Buffer, sig: Buffer, offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  return buf.subarray(offset, offset + sig.length).equals(sig);
}

/**
 * Sanitizes a user-supplied filename while keeping its basename + valid extension.
 */
export function sanitizeOriginalFileName(rawName: string): string {
  const stripped = path.basename((rawName || 'document').replace(/\0/g, '').trim());
  const cleaned = stripped.replace(/[^a-zA-Z0-9._()\-\s]/g, '_').replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned.startsWith('.')) {
    return `document_${Date.now()}`;
  }
  return cleaned.slice(0, 180);
}

function assertNotExecutableOrHtml(buffer: Buffer, allowText: boolean): void {
  for (const magic of BLOCKED_SCRIPT_OR_EXECUTABLE_PREFIXES) {
    if (startsWithBytes(buffer, magic)) {
      throw new AppError('Executable or script payloads are strictly forbidden.', 400, 'UNSAFE_FILE_CONTENT');
    }
  }

  const headUtf8 = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('utf8').trimStart().toLowerCase();
  if (
    headUtf8.startsWith('<svg') ||
    headUtf8.startsWith('<?xml') && headUtf8.includes('<svg') ||
    headUtf8.startsWith('<!doctype html') ||
    headUtf8.startsWith('<html') ||
    headUtf8.startsWith('<?php') ||
    (!allowText && headUtf8.startsWith('<script'))
  ) {
    throw new AppError('HTML, SVG, or script files are not permitted for security reasons.', 400, 'UNSAFE_FILE_CONTENT');
  }

  if (allowText && (headUtf8.includes('<script') || headUtf8.includes('javascript:'))) {
    throw new AppError('Active script markers are not allowed inside text documents.', 400, 'UNSAFE_FILE_CONTENT');
  }
}

function validateOoxmlMarker(buffer: Buffer, ext: 'docx' | 'xlsx' | 'pptx'): void {
  if (!startsWithBytes(buffer, ZIP_MAGIC)) {
    throw new AppError(`Invalid ${ext.toUpperCase()} file signature.`, 400, 'INVALID_FILE_SIGNATURE');
  }
  const requiredDir = ext === 'docx' ? 'word/' : ext === 'xlsx' ? 'xl/' : 'ppt/';
  const scanSlice = buffer.subarray(0, Math.min(buffer.length, 4 * 1024 * 1024));
  const hasContentTypes = scanSlice.includes(Buffer.from('[Content_Types].xml'));
  const hasTypeDir = scanSlice.includes(Buffer.from(requiredDir));
  if (!hasContentTypes && !hasTypeDir) {
    throw new AppError(
      `File content does not match a valid ${ext.toUpperCase()} document structure.`,
      400,
      'INVALID_FILE_SIGNATURE'
    );
  }
}

function validatePlainText(buffer: Buffer): void {
  if (buffer.includes(0x00)) {
    throw new AppError('Binary payload detected inside TXT upload.', 400, 'INVALID_FILE_SIGNATURE');
  }
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  let suspiciousControls = 0;
  for (let i = 0; i < sample.length; i += 1) {
    const b = sample[i];
    if (b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d) {
      suspiciousControls += 1;
    }
  }
  if (suspiciousControls > Math.max(2, sample.length * 0.02)) {
    throw new AppError('Uploaded .txt file contains non-text binary bytes.', 400, 'INVALID_FILE_SIGNATURE');
  }
}

/**
 * Validates file size, extension, magic bytes/structure, and computes SHA-256 of the raw bytes.
 */
export function validateUploadedDocumentBuffer(params: {
  originalName: string;
  buffer: Buffer;
  claimedMimeType?: string;
}): ValidatedFileInfo {
  const { originalName, buffer } = params;
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError('Uploaded file is empty.', 400, 'EMPTY_FILE');
  }

  if (buffer.length > config.storage.maxUploadBytes) {
    const maxMb = Math.round(config.storage.maxUploadBytes / (1024 * 1024));
    throw new AppError(`File exceeds maximum allowed upload limit of ${maxMb} MB.`, 400, 'FILE_TOO_LARGE');
  }

  const safeOriginalFileName = sanitizeOriginalFileName(originalName);
  const rawExt = path.extname(safeOriginalFileName).replace('.', '').toLowerCase();

  if (!rawExt || !(rawExt in EXTENSION_MIME_MAP)) {
    throw new AppError(
      'Unsupported file format. Allowed formats: PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT.',
      400,
      'UNSUPPORTED_FILE_TYPE'
    );
  }

  const extension = rawExt as SupportedExtension;
  assertNotExecutableOrHtml(buffer, extension === 'txt');

  // Strict magic-byte verification independent of claimed Content-Type or filename
  switch (extension) {
    case 'pdf': {
      const head = buffer.subarray(0, 1024).toString('latin1');
      if (!head.includes('%PDF-')) {
        throw new AppError('Uploaded file is not a valid PDF document.', 400, 'INVALID_FILE_SIGNATURE');
      }
      break;
    }
    case 'jpg':
    case 'jpeg': {
      if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
        throw new AppError('Uploaded file does not match JPEG image signature.', 400, 'INVALID_FILE_SIGNATURE');
      }
      break;
    }
    case 'png': {
      if (!startsWithBytes(buffer, PNG_MAGIC)) {
        throw new AppError('Uploaded file does not match PNG image signature.', 400, 'INVALID_FILE_SIGNATURE');
      }
      break;
    }
    case 'webp': {
      const riff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
      const webp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
      if (buffer.length < 12 || !riff || !webp) {
        throw new AppError('Uploaded file does not match WEBP image signature.', 400, 'INVALID_FILE_SIGNATURE');
      }
      break;
    }
    case 'doc':
    case 'xls':
    case 'ppt': {
      if (!startsWithBytes(buffer, OLE2_MAGIC)) {
        throw new AppError(
          `Uploaded file does not match legacy ${extension.toUpperCase()} document signature.`,
          400,
          'INVALID_FILE_SIGNATURE'
        );
      }
      break;
    }
    case 'docx':
    case 'xlsx':
    case 'pptx': {
      validateOoxmlMarker(buffer, extension);
      break;
    }
    case 'txt': {
      validatePlainText(buffer);
      break;
    }
  }

  const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  return {
    safeOriginalFileName,
    extension,
    detectedMimeType: EXTENSION_MIME_MAP[extension],
    fileSize: buffer.length,
    checksumSha256,
    isImage: extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'webp',
    isText: extension === 'txt',
    isPdf: extension === 'pdf'
  };
}

