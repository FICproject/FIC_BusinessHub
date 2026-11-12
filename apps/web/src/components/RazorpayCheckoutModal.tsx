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
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import {
  completeTestModeRazorpayPayment,
  createRazorpayPaymentOrder,
  extractApiErrorMessage,
  fetchRazorpayCheckoutConfig,
  RazorpayEnabledMethods,
  RazorpayGatewayMethods,
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

const VERIFIED_TEST_VISA_CARD = '4718609108204366';

function formatIndianRazorpayContact(raw: string): string {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  if (digits.length >= 10) {
    return `+91${digits.slice(-10)}`;
  }
  return raw.replace(/[^0-9+]/g, '');
}

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
  const [upiId, setUpiId] = useState('success@razorpay');
  const [qrOutcome, setQrOutcome] = useState<'success' | 'failure'>('success');
  const [cardMode, setCardMode] = useState<'instant' | 'popup'>('instant');
  const [testCardOutcome, setTestCardOutcome] = useState<'success' | 'failure'>('success');
  const [copiedCard, setCopiedCard] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<RazorpayEnabledMethods | null>(null);
  const [gatewayMethods, setGatewayMethods] = useState<RazorpayGatewayMethods | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'TEST' | 'LIVE'>('TEST');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    if (isOpen) {
      setErrorMessage(null);
      setStatusMessage(null);
      setIsProcessing(false);
      setQrOutcome('success');
      setTestCardOutcome('success');
      fetchRazorpayCheckoutConfig().then((cfg) => {
        if (!active || !cfg) return;
        setCheckoutMode(cfg.mode);
        setEnabledMethods(cfg.methods);
        setGatewayMethods(cfg.gatewayMethods || null);
        setSelectedMethod((prev) => {
          if (cfg.methods[prev]) return prev;
          if (cfg.methods.upi) return 'upi';
          if (cfg.methods.card) return 'card';
          if (cfg.methods.netbanking) return 'netbanking';
          return 'wallet';
        });
      });
    }
    return () => {
      active = false;
    };
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
    if (isProcessing) return;
    setErrorMessage(null);

    if (selectedMethod === 'upi' && upiMode === 'vpa') {
      const trimmedVpa = upiId.trim();
      if (trimmedVpa && !/^[\w.-]{2,}@[a-zA-Z0-9.-]{2,}$/.test(trimmedVpa)) {
        setErrorMessage('Please enter a valid UPI ID (e.g. success@razorpay or yourname@okicici).');
        return;
      }
    }

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

      setStatusMessage('Creating server-verified Razorpay order...');
      const order = await createRazorpayPaymentOrder({
        purpose,
        amount: purpose === 'WALLET_TOPUP' ? amount : undefined,
        serviceId,
        preferredMethod: selectedMethod,
        notes,
        tokenOverride: activeToken
      });

      if (order.mode) setCheckoutMode(order.mode);
      if (order.enabledMethods) setEnabledMethods(order.enabledMethods);
      if (order.gatewayMethods) setGatewayMethods(order.gatewayMethods);

      createdOrderId = order.razorpayOrderId;
      internalPaymentId = order.paymentId;

      const isTestMode = order.mode === 'TEST';
      const hasGatewayUpi = Boolean((order.gatewayMethods || gatewayMethods)?.upi);

      // In TEST Mode:
      // 1) UPI/QR uses backend-verified Test Mode completion when merchant test key lacks Razorpay UPI Collect activation.
      // 2) Cards when set to Quick Test Card use backend-verified Test Mode completion (or user can switch to Razorpay 3DS Popup).
      const shouldUseTestSimulator =
        isTestMode &&
        ((selectedMethod === 'upi' && !hasGatewayUpi) ||
          (selectedMethod === 'card' && cardMode === 'instant'));

      if (shouldUseTestSimulator) {
        const simMethod = selectedMethod === 'upi' ? 'UPI' : 'CARD';
        const effectiveVpa =
          selectedMethod === 'upi'
            ? upiMode === 'vpa'
              ? upiId.trim() || 'success@razorpay'
              : qrOutcome === 'failure'
              ? 'failure@razorpay'
              : 'qr@razorpay'
            : undefined;
        const outcome: 'success' | 'failure' =
          selectedMethod === 'upi'
            ? effectiveVpa?.toLowerCase() === 'failure@razorpay'
              ? 'failure'
              : 'success'
            : testCardOutcome;

        setStatusMessage(
          simMethod === 'UPI'
            ? 'Authorizing UPI payment & verifying signature in Test Mode...'
            : 'Authorizing Test Card & verifying signature in Test Mode...'
        );

        const verified = await completeTestModeRazorpayPayment({
          razorpay_order_id: order.razorpayOrderId,
          method: simMethod,
          vpa: effectiveVpa,
          outcome,
          tokenOverride: activeToken
        });

        setIsProcessing(false);
        setStatusMessage(null);
        onSuccess({
          ...verified,
          paymentId: verified.razorpayPaymentId || verified.paymentId,
          method: verified.paymentMethod || simMethod,
          timestamp: verified.verifiedAt || new Date().toISOString()
        });
        return;
      }

      setStatusMessage('Loading Razorpay Standard Checkout...');
      await loadRazorpayCheckoutScript();

      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout SDK could not be loaded in this browser.');
      }

      const rawContact = formatIndianRazorpayContact(order.prefill.contact || userPhone || '');
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
          contact: rawContact,
          method: selectedMethod,
          ...(selectedMethod === 'upi' && upiMode === 'vpa' && upiId.trim() ? { vpa: upiId.trim() } : {})
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
          escape: false,
          backdropclose: false,
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
              extractApiErrorMessage(
                verifyErr,
                'Payment signature verification failed. Please contact support with your Razorpay Payment ID if funds were debited.'
              )
            );
          }
        }
      };

      const rzpInstance = new window.Razorpay(rzpOptions);
      rzpInstance.on('payment.failed', async (failureResp: any) => {
        const errDesc = extractApiErrorMessage(
          failureResp,
          'Payment attempt was declined by the gateway.'
        );
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
      setErrorMessage(extractApiErrorMessage(err, 'Unable to initiate Razorpay payment. Please try again.'));
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
                  {checkoutMode} MODE
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
              const isDisabledMethod =
                checkoutMode === 'LIVE' &&
                enabledMethods !== null &&
                ((id === 'upi' && !enabledMethods.upi) ||
                  (id === 'card' && !enabledMethods.card) ||
                  (id === 'netbanking' && !enabledMethods.netbanking) ||
                  (id === 'wallet' && !enabledMethods.wallet));
              return (
                <button
                  key={id}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setSelectedMethod(id);
                    setErrorMessage(null);
                  }}
                  className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border transition-all ${
                    active
                      ? 'bg-[#EEF5FF] border-blue-500 text-blue-700 shadow-sm'
                      : isDisabledMethod
                      ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-75 hover:opacity-100'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {isDisabledMethod && (
                    <span className="absolute -top-2 right-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-[8px] font-extrabold uppercase tracking-wider text-amber-800">
                      Off
                    </span>
                  )}
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : isDisabledMethod ? 'text-slate-400' : 'text-slate-600'}`} />
                  <span className="text-xs font-bold">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Method Detail Panel */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            {selectedMethod === 'upi' && (
              checkoutMode === 'LIVE' && enabledMethods && !enabledMethods.upi ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      UPI Collect / QR Unavailable on Current Key
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-extrabold text-amber-700">
                      MERCHANT SETTING
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    UPI is disabled on the active Razorpay merchant key ({checkoutMode} Mode). Enable UPI in Razorpay Dashboard under Settings → Payment Methods, or pay immediately using Cards, Banking, or Wallet:
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {enabledMethods.card && (
                      <button
                        type="button"
                        onClick={() => { setSelectedMethod('card'); setErrorMessage(null); }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                      >
                        Use Cards
                      </button>
                    )}
                    {enabledMethods.netbanking && (
                      <button
                        type="button"
                        onClick={() => { setSelectedMethod('netbanking'); setErrorMessage(null); }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900"
                      >
                        Use Banking
                      </button>
                    )}
                    {enabledMethods.wallet && (
                      <button
                        type="button"
                        onClick={() => { setSelectedMethod('wallet'); setErrorMessage(null); }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                      >
                        Use Wallet
                      </button>
                    )}
                  </div>
                </div>
              ) : (
              <>
                <div className="grid grid-cols-2 bg-slate-200/70 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setUpiMode('vpa'); setErrorMessage(null); }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      upiMode === 'vpa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    UPI ID / VPA
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUpiMode('qr'); setErrorMessage(null); }}
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
                        {checkoutMode === 'TEST' ? 'TEST UPI READY' : 'INSTANT'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder={checkoutMode === 'TEST' ? 'success@razorpay' : 'Enter UPI ID (e.g. yourname@oksbi)'}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                    {checkoutMode === 'TEST' && (
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-semibold text-slate-500">Quick test:</span>
                        <button
                          type="button"
                          onClick={() => { setUpiId('success@razorpay'); setErrorMessage(null); }}
                          className={`px-2.5 py-1 rounded-lg border font-bold transition-colors ${
                            upiId.trim().toLowerCase() !== 'failure@razorpay'
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-blue-50'
                          }`}
                        >
                          success@razorpay
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUpiId('failure@razorpay'); setErrorMessage(null); }}
                          className={`px-2.5 py-1 rounded-lg border font-bold transition-colors ${
                            upiId.trim().toLowerCase() === 'failure@razorpay'
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          failure@razorpay
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500">
                      {checkoutMode === 'TEST' && !gatewayMethods?.upi
                        ? 'Click Pay below to authorize this UPI VPA via Razorpay Test Mode & verify signature.'
                        : 'Click Pay below to launch Razorpay Checkout and authorize via UPI.'}
                    </p>
                  </div>
                ) : (
                  <div className="py-1.5 space-y-2.5">
                    {checkoutMode === 'TEST' && !gatewayMethods?.upi ? (
                      <div className="flex items-center gap-3.5 bg-white border border-slate-200 rounded-xl p-3">
                        <div className="w-20 h-20 rounded-lg border border-slate-200 bg-white p-1.5 shrink-0 flex items-center justify-center">
                          <svg viewBox="0 0 36 36" className="w-full h-full text-slate-900" aria-label="Dynamic Test UPI QR">
                            <rect x="2" y="2" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
                            <rect x="5" y="5" width="4" height="4" fill="currentColor" />
                            <rect x="24" y="2" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
                            <rect x="27" y="5" width="4" height="4" fill="currentColor" />
                            <rect x="2" y="24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
                            <rect x="5" y="27" width="4" height="4" fill="currentColor" />
                            <rect x="15" y="4" width="3" height="3" fill="currentColor" />
                            <rect x="19" y="8" width="3" height="3" fill="currentColor" />
                            <rect x="14" y="14" width="4" height="4" fill="currentColor" />
                            <rect x="20" y="14" width="3" height="3" fill="currentColor" />
                            <rect x="25" y="16" width="4" height="3" fill="currentColor" />
                            <rect x="4" y="15" width="4" height="4" fill="currentColor" />
                            <rect x="10" y="18" width="3" height="3" fill="currentColor" />
                            <rect x="16" y="22" width="4" height="4" fill="currentColor" />
                            <rect x="24" y="24" width="4" height="4" fill="currentColor" />
                            <rect x="30" y="26" width="3" height="6" fill="currentColor" />
                            <rect x="16" y="29" width="6" height="3" fill="currentColor" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800">Dynamic Test UPI QR</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-700">
                              ₹{amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            VPA: <span className="font-mono font-semibold text-slate-700">ficbusinesshub@razorpay</span>
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500 font-semibold">Outcome:</span>
                            <button
                              type="button"
                              onClick={() => setQrOutcome('success')}
                              className={`px-2 py-0.5 rounded-md font-bold border ${
                                qrOutcome === 'success'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              Scan Success
                            </button>
                            <button
                              type="button"
                              onClick={() => setQrOutcome('failure')}
                              className={`px-2 py-0.5 rounded-md font-bold border ${
                                qrOutcome === 'failure'
                                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
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
                  </div>
                )}
              </>
              )
            )}

            {selectedMethod === 'card' && (
              checkoutMode === 'TEST' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 bg-slate-200/70 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setCardMode('instant'); setErrorMessage(null); }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        cardMode === 'instant' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Quick Test Card
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCardMode('popup'); setErrorMessage(null); }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        cardMode === 'popup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Razorpay 3DS Popup
                    </button>
                  </div>

                  {cardMode === 'instant' ? (
                    <div className="space-y-2.5 bg-white border border-slate-200 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Verified Domestic Test Card (Visa)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-700">
                          TEST READY
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 font-mono text-slate-800">
                        <span>4718 6091 0820 4366</span>
                        <span className="text-[11px] text-slate-500">12/29 · CVV 123</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-500">Test result:</span>
                        <button
                          type="button"
                          onClick={() => { setTestCardOutcome('success'); setErrorMessage(null); }}
                          className={`px-2.5 py-1 rounded-lg border font-bold ${
                            testCardOutcome === 'success'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          Approve Card
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTestCardOutcome('failure'); setErrorMessage(null); }}
                          className={`px-2.5 py-1 rounded-lg border font-bold ${
                            testCardOutcome === 'failure'
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          Decline Test
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Creates a real Razorpay order and verifies payment signature directly in Test Mode.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Razorpay Standard Card Checkout (3DS)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-extrabold text-blue-700">
                          3D SECURE
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-blue-50/70 border border-blue-200/80 rounded-lg px-2.5 py-2 text-xs">
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-blue-900">4718 6091 0820 4366</div>
                          <div className="text-[11px] text-blue-700">Exp: 12/29 · CVV: 123 · OTP: 123456</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(VERIFIED_TEST_VISA_CARD).catch(() => {});
                            setCopiedCard(true);
                            setTimeout(() => setCopiedCard(false), 1800);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-blue-200 text-blue-700 font-bold hover:bg-blue-100 shrink-0"
                        >
                          {copiedCard ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedCard ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Use the Indian domestic test card above inside Razorpay’s popup (international 4111... or real cards are blocked in Test Mode).
                      </p>
                    </div>
                  )}
                </div>
              ) : (
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
              )
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
            disabled={isProcessing || (checkoutMode === 'LIVE' && selectedMethod === 'upi' && Boolean(enabledMethods && !enabledMethods.upi))}
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
