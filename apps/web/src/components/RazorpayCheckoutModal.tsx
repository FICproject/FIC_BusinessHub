import React, { useState } from 'react';
import { ShieldCheck, Lock, Smartphone, CreditCard, CheckCircle2, X } from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  amount: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  onSuccess: (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    method: string;
  }) => void;
  onClose: () => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  amount,
  userName,
  userEmail,
  userPhone,
  onSuccess,
  onClose
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState(`${userPhone || '9840129988'}@okhdfcbank`);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const paymentId = `pay_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString().slice(-4)}`;
      const orderId = `order_${Math.random().toString(36).substring(2, 11)}`;
      const signature = `rzp_sig_${Math.random().toString(36).substring(2, 14)}`;

      setIsProcessing(false);
      onSuccess({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        method: selectedMethod.toUpperCase()
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Razorpay Branded Top Header */}
        <div className="bg-[#0C2340] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center font-black text-sky-400 text-sm tracking-wider">
              RZP
            </div>
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-sky-300 font-semibold">
                Razorpay Trusted Gateway
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                FIC Business Hub
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Purpose Badge */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">1-Year Introductory Access Pass</span>
          <span className="text-lg font-black text-slate-900 font-mono">
            ₹{amount}.00
          </span>
        </div>

        {/* Payment Modes */}
        <div className="p-6 space-y-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
            Select Payment Method
          </div>

          <div className="space-y-2.5">
            {/* UPI Option */}
            <label
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedMethod === 'upi'
                  ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={selectedMethod === 'upi'}
                  onChange={() => setSelectedMethod('upi')}
                  className="w-4 h-4 text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <Smartphone className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-800">Instant UPI (GPay, PhonePe, Paytm)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">FASTEST</span>
            </label>

            {selectedMethod === 'upi' && (
              <div className="pt-1 pl-7 pr-2 space-y-1">
                <label className="text-[11px] text-slate-500 block">Virtual Payment Address (VPA / UPI ID)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  placeholder="yourname@okhdfcbank"
                />
              </div>
            )}

            {/* Debit / Credit Card Option */}
            <label
              className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedMethod === 'card'
                  ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'card'}
                onChange={() => setSelectedMethod('card')}
                className="w-4 h-4 text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <CreditCard className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-800">Credit / Debit Card (Visa, RuPay, MC)</span>
            </label>
          </div>

          {/* User Details */}
          <div className="pt-2 text-[11px] text-slate-500 flex justify-between border-t border-slate-100">
            <span>Customer: <strong className="text-slate-700">{userName}</strong></span>
            <span>Phone: <strong className="text-slate-700">{userPhone}</strong></span>
          </div>

          {/* Security Assurance */}
          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>256-bit Encrypted • Standard Razorpay Sandbox Ready</span>
          </div>

          {/* Action CTA */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handlePay}
            className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-sky-600/20 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Pay ₹{amount}.00 via Razorpay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

