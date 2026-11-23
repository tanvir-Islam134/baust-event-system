import React, { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService.js';

/**
 * Authentic bKash Payment Gateway (PGW) Checkout Modal.
 * Provides multi-step checkout: Mobile No -> OTP -> PIN -> Instant Ticket Issuance.
 */
export default function BkashCheckoutModal({ sessionData, onClose, onSuccess }) {
  // Steps: 'phone' -> 'otp' -> 'pin' -> 'processing' -> 'success'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('01712345678');
  const [otp, setOtp] = useState('123456');
  const [pin, setPin] = useState('12121');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [copiedTrx, setCopiedTrx] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    let timer;
    if (step === 'otp' && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const cleanPhone = phone.replace(/[-\s]/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setError('Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).');
      return;
    }
    if (!agreed) {
      setError('Please accept the bKash terms and conditions to proceed.');
      return;
    }
    setStep('otp');
    setResendTimer(30);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.trim().length < 4) {
      setError('Please enter a valid verification code (Demo OTP: 123456).');
      return;
    }
    setStep('pin');
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!pin || pin.trim().length < 4) {
      setError('Please enter your 5-digit bKash PIN (Demo PIN: 12121).');
      return;
    }

    try {
      setLoading(true);
      setStep('processing');

      const payload = {
        paymentID: sessionData.paymentID,
        payerPhone: phone.replace(/[-\s]/g, ''),
        otp: otp.trim(),
        pin: pin.trim(),
      };

      const response = await paymentService.executeBkashPayment(payload);
      setResultData(response);
      setStep('success');

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      setStep('pin');
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Payment verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTrx = () => {
    if (resultData?.trxID) {
      navigator.clipboard.writeText(resultData.trxID);
      setCopiedTrx(true);
      setTimeout(() => setCopiedTrx(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 flex items-center justify-center animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* bKash Signature Pink Header */}
        <div className="bg-[#E2136E] text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            {/* bKash Bird Icon SVG */}
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-[#E2136E]">
                <path d="M72.2 13.9L55.5 45.4l24.4 3.7c1.4.2 2.6 1.4 2.8 2.8l2.6 17.5c.3 2.1-1.6 3.9-3.7 3.6L54.7 69l-9.4 17.7c-1 1.9-3.4 2.7-5.3 1.7-1.1-.6-1.8-1.7-2-2.9L33.7 49 14.5 46.1c-2.1-.3-3.6-2.2-3.3-4.3.2-1.3 1.1-2.4 2.3-2.9l46.2-24.3c1.9-1 4.3-.3 5.3 1.6.4.7.6 1.5.5 2.4l-3.3 13.5 13-17.7c1.3-1.7 3.7-2.1 5.4-.8 1.1.9 1.7 2.3 1.6 3.7z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-pink-100">
                Official Payment Gateway
              </div>
              <h2 className="text-lg font-black tracking-tight">bKash Checkout</h2>
            </div>
          </div>

          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Close payment window"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Invoice & Merchant Banner */}
        <div className="bg-pink-50/70 border-b border-pink-100 px-5 py-3 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-[#E2136E]">Merchant:</span>{' '}
            <span className="text-slate-700 font-medium">BAUST Event System</span>
            <div className="text-[11px] text-slate-500 font-mono">
              Inv: {sessionData?.merchantInvoiceNumber || 'INV-2026'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Total Amount</span>
            <span className="text-base font-black text-[#E2136E]">
              ৳ {Number(sessionData?.amount || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="text-base flex-shrink-0">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* STEP 1: Phone Number */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your bKash Account Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                    🇧🇩 +88
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-16 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold tracking-wider text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#E2136E]"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500">e.g. 01712345678</span>
                  <button
                    type="button"
                    onClick={() => setPhone('01712345678')}
                    className="text-[11px] font-bold text-[#E2136E] hover:underline"
                  >
                    ⚡ Auto-fill Demo
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded text-[#E2136E] focus:ring-[#E2136E]"
                />
                <span>
                  I agree to the <span className="font-semibold text-slate-800">bKash Terms & Conditions</span> and authorize this transaction.
                </span>
              </label>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E2136E] hover:bg-[#c70f5e] text-white rounded-xl text-xs font-black shadow-md shadow-[#E2136E]/20 transition"
                >
                  Proceed &rarr;
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center pb-1">
                <div className="w-12 h-12 rounded-full bg-pink-100 text-[#E2136E] flex items-center justify-center text-xl mx-auto mb-2">
                  📩
                </div>
                <h3 className="text-sm font-bold text-slate-800">Enter Verification Code</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  A 6-digit code has been sent to <span className="font-bold text-slate-700">{phone}</span>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] text-lg font-mono font-black py-2.5 border border-slate-300 rounded-xl text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#E2136E]"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500">
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Did not receive code?'}
                  </span>
                  <button
                    type="button"
                    disabled={resendTimer > 0}
                    onClick={() => {
                      setResendTimer(30);
                      setOtp('123456');
                    }}
                    className="text-[11px] font-bold text-[#E2136E] hover:underline disabled:opacity-40"
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E2136E] hover:bg-[#c70f5e] text-white rounded-xl text-xs font-black shadow-md shadow-[#E2136E]/20 transition"
                >
                  Confirm &rarr;
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Enter PIN */}
          {step === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="text-center pb-1">
                <div className="w-12 h-12 rounded-full bg-pink-100 text-[#E2136E] flex items-center justify-center text-xl mx-auto mb-2">
                  🔒
                </div>
                <h3 className="text-sm font-bold text-slate-800">Enter Your bKash PIN</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter 5-digit PIN to authorize payment of <span className="font-bold text-[#E2136E]">৳ {sessionData.amount}</span>
                </p>
              </div>

              <div>
                <input
                  type="password"
                  maxLength={5}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="•••••"
                  className="w-full text-center tracking-[0.6em] text-xl font-mono font-black py-2.5 border border-slate-300 rounded-xl text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#E2136E]"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400">Demo Testing PIN: 12121</span>
                  <button
                    type="button"
                    onClick={() => setPin('12121')}
                    className="text-[11px] font-bold text-[#E2136E] hover:underline"
                  >
                    Auto-fill 12121
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                <span>🛡️</span>
                <span>Protected by bKash 256-bit SSL Banking Encryption</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#E2136E] hover:bg-[#c70f5e] text-white rounded-xl text-xs font-black shadow-md shadow-[#E2136E]/20 transition disabled:opacity-50"
                >
                  Pay ৳ {sessionData.amount}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Processing State */}
          {step === 'processing' && (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 border-4 border-[#E2136E] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Processing bKash Transaction...</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Communicating with bKash PGW network. Please do not close or reload this window.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Success State */}
          {step === 'success' && resultData && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                ✓
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  Payment Verified
                </span>
                <h3 className="text-lg font-black text-slate-800 mt-1.5">
                  Payment Successful! 🎉
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your seat is confirmed and your digital pass has been issued.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 text-xs text-left space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Transaction ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#E2136E]">
                      {resultData.trxID}
                    </span>
                    <button
                      onClick={handleCopyTrx}
                      className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                      title="Copy TrxID"
                    >
                      {copiedTrx ? '✓' : '📋'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Amount Paid:</span>
                  <span className="font-bold text-slate-800">৳ {resultData.amount} BDT</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Ticket Code:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {resultData.ticketCode}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-emerald-700 font-bold">Auto-Approved (Instant)</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#14213D] hover:bg-[#1E293B] text-white rounded-xl text-xs font-black shadow-lg shadow-[#14213D]/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🎫</span>
                <span>Open Digital Pass & QR</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100/80 px-5 py-2.5 border-t border-slate-200 text-center text-[10px] text-slate-500 font-medium">
          BAUST Event Management System • Secured by bKash PGW
        </div>
      </div>
    </div>
  );
}
