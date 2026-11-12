import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  MapPin,
  QrCode,
  RefreshCw
} from 'lucide-react';
import {
  createRazorpayPaymentOrder,
  RazorpayOrderPurpose,
  RazorpayVerifyResponse,
  recordRazorpayFailure,
  verifyRazorpayPayment
} from '../services/api';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, any>) => {
      open: () => void;
      close?: () => void;
      on: (event: string, cb: (res: any) => void) => void;
    };
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve();
  }
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing && window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve();
      } else {
        razorpayScriptPromise = null;
        reject(new Error('Razorpay Checkout SDK initialized without window.Razorpay.'));
      }
    };
    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error('Unable to load Razorpay Checkout script. Please check your internet connection or ad-blocker.'));
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export interface RazorpayModalProps {
  isOpen: boolean;
  amount: number;
  purpose?: RazorpayOrderPurpose;
  serviceId?: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  orderLabel?: string;
  orderSubtitle?: string;
  deliveryLocation?: string;
  onChangeDeliveryLocation?: () => void;
  tokenOverride?: string;
  ensureAuthToken?: () => Promise<string | undefined>;
  notes?: Record<string, string>;
  onSuccess: (paymentData: RazorpayVerifyResponse & { paymentId: string; method: string; timestamp: string }) => void;
  onClose: () => void;
}

type PaymentMethodKey = 'upi' | 'card' | 'netbanking' | 'wallet';

export const RazorpayCheckoutModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  amount,
  purpose = 'MEMBERSHIP_FIRST_YEAR',
  serviceId,
  userName,
  userEmail,
  userPhone,
  orderLabel,
  orderSubtitle,
  deliveryLocation,
  onChangeDeliveryLocation,
  tokenOverride,
  ensureAuthToken,
  notes,
  onSuccess,
  onClose
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodKey>('upi');
  const [upiMode, setUpiMode] = useState<'vpa' | 'qr'>('vpa');
  const [upiId, setUpiId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setStatusMessage(null);
      setIsProcessing(false);
    }
  }, [isOpen, amount, purpose]);

  if (!isOpen) return null;

  const resolvedBannerTitle =
    orderLabel ||
    (purpose === 'MEMBERSHIP_FIRST_YEAR'
      ? 'MEMBERSHIP ACTIVATION'
      : purpose === 'MEMBERSHIP_RENEWAL'
      ? 'MEMBERSHIP RENEWAL'
      : purpose === 'WALLET_TOPUP'
      ? 'FIC WALLET TOP-UP'
      : 'PRODUCT ORDER');

  const resolvedBannerSubtitle =
    orderSubtitle || (userName ? `${userName} (${userEmail || 'Verified Account'})` : 'Verified FIC Member');

  const methodButtonLabel =
    selectedMethod === 'upi'
      ? `PAY ₹${amount.toLocaleString('en-IN')} VIA UPI`
      : selectedMethod === 'card'
      ? `PAY ₹${amount.toLocaleString('en-IN')} VIA CARD`
      : selectedMethod === 'netbanking'
      ? `PAY ₹${amount.toLocaleString('en-IN')} VIA NETBANKING`
      : `PAY ₹${amount.toLocaleString('en-IN')} VIA WALLET`;

  const handleLaunchCheckout = async () => {
    setErrorMessage(null);
    setStatusMessage('Preparing secure Razorpay order...');
    setIsProcessing(true);

    let createdOrderId: string | undefined;
    let internalPaymentId: string | undefined;
    let activeToken = tokenOverride;

    try {
      if (ensureAuthToken) {
        setStatusMessage('Finalizing account & document session...');
        const ensured = await ensureAuthToken();
        if (ensured) activeToken = ensured;
      }

      setStatusMessage('Loading Razorpay Standard Checkout...');
      await loadRazorpayCheckoutScript();

      setStatusMessage('Creating server-verified Razorpay order...');
      const order = await createRazorpayPaymentOrder({
        purpose,
        amount: purpose === 'WALLET_TOPUP' ? amount : undefined,
        serviceId,
        preferredMethod: selectedMethod,
        notes,
        tokenOverride: activeToken
      });

      createdOrderId = order.razorpayOrderId;
      internalPaymentId = order.paymentId;

      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout SDK could not be loaded in this browser.');
      }

      const rzpOptions: Record<string, any> = {
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: 'FIC Business Hub',
        description: order.description,
        order_id: order.razorpayOrderId,
        prefill: {
          name: order.prefill.name || userName,
          email: order.prefill.email || userEmail,
          contact: (order.prefill.contact || userPhone || '').replace(/[^0-9+]/g, ''),
          ...(selectedMethod === 'upi' && upiMode === 'vpa' && upiId.trim()
            ? { vpa: upiId.trim(), method: 'upi' }
            : { method: selectedMethod })
        },
        notes: {
          internalOrderId: order.internalOrderId,
          purpose: order.purpose
        },
        theme: {
          color: '#0A1D37'
        },
        modal: {
          confirm_close: true,
          ondismiss: async () => {
            if (internalPaymentId) {
              await recordRazorpayFailure({
                paymentId: internalPaymentId,
                razorpay_order_id: createdOrderId,
                status: 'CANCELLED',
                reason: 'Checkout modal closed by user before completing payment',
                tokenOverride: activeToken
              });
            }
            setIsProcessing(false);
            setStatusMessage(null);
            setErrorMessage('Payment was cancelled before completion. You can safely retry anytime.');
          }
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setStatusMessage('Verifying cryptographic payment signature with FIC server...');
            const verified = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentMethod: selectedMethod.toUpperCase(),
              tokenOverride: activeToken
            });

            setIsProcessing(false);
            setStatusMessage(null);
            onSuccess({
              ...verified,
              paymentId: verified.razorpayPaymentId || response.razorpay_payment_id,
              method: verified.paymentMethod || selectedMethod.toUpperCase(),
              timestamp: verified.verifiedAt || new Date().toISOString()
            });
          } catch (verifyErr: any) {
            setIsProcessing(false);
            setStatusMessage(null);
            setErrorMessage(
              verifyErr?.message ||
                'Payment signature verification failed. Please contact support with your Razorpay Payment ID if funds were debited.'
            );
          }
        }
      };

      const rzpInstance = new window.Razorpay(rzpOptions);
      rzpInstance.on('payment.failed', async (failureResp: any) => {
        const errDesc =
          failureResp?.error?.description ||
          failureResp?.error?.reason ||
          'Payment attempt was declined by the gateway.';
        if (internalPaymentId) {
          await recordRazorpayFailure({
            paymentId: internalPaymentId,
            razorpay_order_id: createdOrderId,
            razorpay_payment_id: failureResp?.error?.metadata?.payment_id,
            status: 'FAILED',
            reason: errDesc,
            tokenOverride: activeToken
          });
        }
        setIsProcessing(false);
        setStatusMessage(null);
        setErrorMessage(`Payment Failed: ${errDesc}`);
      });

      setStatusMessage('Complete authorization in the Razorpay secure window...');
      rzpInstance.open();
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage(null);
      setErrorMessage(err?.message || 'Unable to initiate Razorpay payment. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Razorpay Payment Checkout"
    >
      <div className="relative w-full max-w-[490px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Dark Navy Razorpay Header matching reference design */}
        <div className="bg-[#0A1D37] px-6 py-5 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#1D6FF2] flex items-center justify-center shrink-0 shadow-md shadow-blue-950/50">
              <span className="text-xl font-black tracking-tight text-white">R</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-extrabold tracking-tight text-white">
                  Razorpay Payment
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#DC2626] text-[10px] font-extrabold uppercase tracking-wider text-white">
                  TEST MODE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                Secured by Razorpay 256-Bit SSL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-extrabold tracking-widest uppercase text-slate-300">
                TOTAL AMOUNT
              </div>
              <div className="text-2xl font-black text-[#FFD13B] leading-tight">
                ₹{amount.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Close checkout"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Warm Amber Summary Banner */}
        <div className="bg-[#FFF9E6] border-b border-amber-200/80 px-6 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-800">
              <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{resolvedBannerTitle}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-amber-300 text-[10px] font-extrabold tracking-wide text-amber-700">
              CONFIRMED DETAILS
              <CheckCircle2 className="w-3 h-3 text-amber-600" />
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700 truncate">{resolvedBannerSubtitle}</span>
            {deliveryLocation && (
              <div className="flex items-center gap-1.5 shrink-0 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate max-w-[140px]">{deliveryLocation}</span>
                {onChangeDeliveryLocation && (
                  <button
                    type="button"
                    onClick={onChangeDeliveryLocation}
                    className="text-amber-700 font-extrabold uppercase tracking-wider hover:underline text-[11px]"
                  >
                    CHANGE
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods & Interaction Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="text-[11px] font-extrabold tracking-widest uppercase text-slate-400">
            SELECT PAYMENT METHOD
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {(
              [
                { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                { id: 'card', label: 'Cards', icon: CreditCard },
                { id: 'netbanking', label: 'Banking', icon: Building2 },
                { id: 'wallet', label: 'Wallet', icon: Wallet }
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const active = selectedMethod === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setSelectedMethod(id)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border transition-all ${
                    active
                      ? 'bg-[#EEF5FF] border-blue-500 text-blue-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-600'}`} />
                  <span className="text-xs font-bold">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Method Detail Panel */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            {selectedMethod === 'upi' && (
              <>
                <div className="grid grid-cols-2 bg-slate-200/70 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUpiMode('vpa')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      upiMode === 'vpa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    UPI ID / VPA
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiMode('qr')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      upiMode === 'qr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Scan QR Code
                  </button>
                </div>

                {upiMode === 'vpa' ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Google Pay / PhonePe / Paytm
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-700">
                        INSTANT
                      </span>
                    </div>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="Enter UPI ID (e.g. yourname@oksbi)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-semibold text-slate-500">Quick test:</span>
                      <button
                        type="button"
                        onClick={() => setUpiId('success@razorpay')}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold hover:bg-blue-100"
                      >
                        success@razorpay
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiId('failure@razorpay')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-bold hover:bg-slate-200"
                      >
                        failure@razorpay
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Click Pay below to launch Razorpay Test Mode Checkout and authorize via UPI.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-2 space-y-1.5">
                    <QrCode className="w-10 h-10 text-blue-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Dynamic UPI QR Code</p>
                    <p className="text-[11px] text-slate-500">
                      A real Razorpay order-bound QR code is rendered inside Razorpay’s secure checkout window when you click Pay below.
                    </p>
                  </div>
                )}
              </>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Credit / Debit / RuPay Cards
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-extrabold text-blue-700">
                    3D SECURE
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Card numbers & CVV are entered strictly inside Razorpay’s PCI-DSS certified Checkout window (never handled or stored on FIC servers).
                </p>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Indian Bank NetBanking
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-extrabold text-indigo-700">
                    50+ BANKS
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Select SBI, HDFC, ICICI, Axis, Kotak, or other supported banks inside Razorpay’s official checkout popup.
                </p>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Digital Wallets (PhonePe, Amazon Pay, PayZapp)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-700">
                    RAZORPAY
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Authorize payment directly with your supported wallet inside Razorpay Standard Checkout.
                </p>
              </div>
            )}
          </div>

          {/* Live Status & Error Feedback */}
          {statusMessage && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleLaunchCheckout}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-[11px] font-bold shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* Primary Pay Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleLaunchCheckout}
            className="w-full py-4 px-5 rounded-2xl bg-[#0A1D37] hover:bg-[#0F2A4D] disabled:opacity-60 text-white font-extrabold text-sm tracking-wide uppercase shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                PROCESSING SECURE PAYMENT...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {methodButtonLabel}
              </>
            )}
          </button>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Merchant: FIC Business Hub · Connect App India</span>
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="font-bold text-slate-600 underline hover:text-slate-900 disabled:opacity-50"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
