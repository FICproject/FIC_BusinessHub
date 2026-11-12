import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { downloadOriginalDocument, fetchAuthenticatedDocumentBlob } from '../services/api';

export interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentLabel?: string;
  originalFileName?: string;
  originalMimeType?: string;
  originalFileSize?: number;
  checksum?: string;
  tokenOverride?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentLabel,
  originalFileName,
  originalMimeType,
  originalFileSize,
  checksum,
  tokenOverride
}) => {
  const isImage = Boolean(originalMimeType?.startsWith('image/'));
  const isPdf = originalMimeType === 'application/pdf';
  const isText = originalMimeType === 'text/plain';

  const [variant, setVariant] = useState<'preview' | 'original'>('preview');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [resolvedMeta, setResolvedMeta] = useState<{ fileName: string; checksum: string | null; variantServed: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !documentId) return;

    let active = true;
    let createdUrl: string | null = null;
    setLoading(true);
    setError(null);
    setTextContent(null);

    fetchAuthenticatedDocumentBlob(documentId, {
      variant: isImage ? variant : 'original',
      action: 'view',
      tokenOverride
    })
      .then(async (res) => {
        if (!active) {
          URL.revokeObjectURL(res.blobUrl);
          return;
        }
        createdUrl = res.blobUrl;
        setBlobUrl(res.blobUrl);
        setResolvedMeta({
          fileName: res.fileName || originalFileName || documentId,
          checksum: res.checksum || checksum || null,
          variantServed: res.variantServed
        });
        if (isText) {
          const text = await res.blob.text();
          if (active) setTextContent(text);
        }
      })
      .catch((err: any) => {
        if (active) setError(err?.message || 'Unable to load private document.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
      setBlobUrl(null);
    };
  }, [isOpen, documentId, variant, isImage, isText, originalFileName, checksum, tokenOverride]);

  if (!isOpen) return null;

  const handleDownloadOriginal = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadOriginalDocument(documentId, originalFileName);
    } catch (err: any) {
      setError(err?.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">
                {documentLabel || originalFileName || 'Private Document'}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {originalFileName} · {originalMimeType} · {formatBytes(originalFileSize)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isImage && (
              <div className="inline-flex bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setVariant('preview')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    variant === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Optimized Preview
                </button>
                <button
                  type="button"
                  onClick={() => setVariant('original')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    variant === 'original' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Exact Original
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownloadOriginal}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download Original
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close document preview"
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewer Stage */}
        <div className="flex-1 bg-slate-100 overflow-auto p-6 flex items-center justify-center min-h-[380px]">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Decrypting & verifying document integrity...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : isImage && blobUrl ? (
            <img
              src={blobUrl}
              alt={originalFileName || 'Document preview'}
              className="max-w-full max-h-[62vh] object-contain rounded-xl shadow-md bg-white"
            />
          ) : isPdf && blobUrl ? (
            <iframe
              src={blobUrl}
              title={originalFileName || 'PDF Document'}
              className="w-full h-[62vh] rounded-xl border border-slate-200 bg-white"
            />
          ) : isText && textContent !== null ? (
            <pre className="w-full max-h-[62vh] overflow-auto bg-white border border-slate-200 rounded-xl p-5 text-xs text-slate-800 whitespace-pre-wrap font-mono">
              {textContent}
            </pre>
          ) : (
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
              <FileText className="w-12 h-12 text-blue-600 mx-auto" />
              <div className="text-sm font-bold text-slate-900">
                {originalFileName || 'Document File'}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                This file format ({originalFileName?.split('.').pop()?.toUpperCase() || originalMimeType}) is preserved in its exact original binary form and can be downloaded safely without alteration.
              </p>
              <button
                type="button"
                onClick={handleDownloadOriginal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                Download Exact Original ({formatBytes(originalFileSize)})
              </button>
            </div>
          )}
        </div>

        {/* Integrity Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-4 text-[11px] text-slate-500 flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Original Bytes Preserved · Private Access Only
            {resolvedMeta?.variantServed ? ` · Viewing: ${resolvedMeta.variantServed.toUpperCase()}` : ''}
          </span>
          {(resolvedMeta?.checksum || checksum) && (
            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[360px]">
              SHA-256: {resolvedMeta?.checksum || checksum}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

