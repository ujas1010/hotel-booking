import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  KeyRound,
  MessageSquare,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { issueOtp, verifyOtpCode } from '../utils/otpService.ts';

interface OtpVerificationModalProps {
  isOpen: boolean;
  phone: string;
  guestName?: string;
  purpose?: string;
  onClose: () => void;
  onVerified: (phone: string, otpCode: string) => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  phone,
  guestName = 'Valued Guest',
  purpose = 'Guest Identity Verification',
  onClose,
  onVerified,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeCode, setActiveCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(180); // 3-minute timer
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [smsBannerVisible, setSmsBannerVisible] = useState(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send OTP when modal opens or phone changes
  useEffect(() => {
    if (isOpen && phone) {
      sendNewOtp();
    }
  }, [isOpen, phone]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0 || isSuccess) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft, isSuccess]);

  const sendNewOtp = () => {
    setError(null);
    setDigits(['', '', '', '', '', '']);
    setTimeLeft(180);
    setSmsBannerVisible(true);
    setIsSuccess(false);

    try {
      const res = issueOtp(phone, 'identity_verification');
      setActiveCode(res.code);
      // Auto focus first input
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    } catch (err: any) {
      setError('Could not generate verification code.');
    }
  };

  if (!isOpen) return null;

  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : phone;

  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, '');

    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Support paste of entire 6-digit code
    if (cleaned.length >= 6) {
      const pasted = cleaned.slice(0, 6).split('');
      setDigits(pasted);
      if (inputRefs.current[5]) inputRefs.current[5].focus();
      validateOtpString(cleaned.slice(0, 6));
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned[cleaned.length - 1];
    setDigits(newDigits);

    // Auto advance to next input
    if (index < 5 && cleaned) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all filled, auto submit
    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      validateOtpString(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validateOtpString = async (codeToVerify: string) => {
    setIsVerifying(true);
    setError(null);

    // Short simulate delay for realism
    await new Promise((r) => setTimeout(r, 400));

    const verifyResult = verifyOtpCode(phone, codeToVerify);
    if (verifyResult.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsVerifying(false);
        onVerified(phone, codeToVerify);
        onClose();
      }, 800);
    } else {
      setIsVerifying(false);
      setError(verifyResult.error || 'Invalid OTP. Please check the code and try again.');
    }
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    validateOtpString(fullCode);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      id="otp-verification-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1916]/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="otp-verification-modal-card"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#ECE5D8] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#1C1916] px-6 py-5 text-[#FAF8F5] relative border-b border-[#947139]/30">
          <button
            id="otp-modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-[#ECE5D8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#947139]/20 border border-[#947139]/40 flex items-center justify-center text-[#E6CA85] font-serif font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-[#E6CA85]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#E6CA85] font-serif">
              Palace Identity Gate
            </span>
          </div>

          <h2 className="text-xl font-serif font-bold tracking-tight text-[#FAF8F5]">
            OTP Mobile Verification
          </h2>
          <p className="text-xs text-[#ECE5D8] mt-1 font-light">
            Verifying guest credentials for <strong className="text-white font-medium">{guestName}</strong>
          </p>
        </div>

        {/* Live Simulated SMS Notification Preview */}
        {smsBannerVisible && activeCode && (
          <div className="bg-[#FBF9F5] border-b border-[#ECE5D8] p-3.5 px-6 animate-in slide-in-from-top duration-300">
            <div className="bg-white border border-[#947139]/30 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-[11px] text-[#7B5C28] font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#947139]" />
                  SMS Notification Received
                </span>
                <span className="text-[10px] text-[#948A7D]">Just now</span>
              </div>
              <p className="text-xs text-[#1C1916] font-mono leading-relaxed">
                &ldquo;Your Grand Imperial Palace OTP is{' '}
                <span className="bg-[#F6F1E7] text-[#7B5C28] font-bold px-1.5 py-0.5 rounded border border-[#947139]/30 tracking-wider">
                  {activeCode}
                </span>
                . Use this code to complete {purpose.toLowerCase()}. Valid for 5 mins.&rdquo;
              </p>
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const codeArr = activeCode.split('');
                    setDigits(codeArr);
                    validateOtpString(activeCode);
                  }}
                  className="text-[11px] text-[#947139] hover:text-[#7B5C28] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-fill code ({activeCode})
                </button>
                <span className="text-[10px] text-[#948A7D]">Receiver: {formattedPhone}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Form Body */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-xs text-[#665E55]">
              We have dispatched a 6-digit verification code to
            </p>
            <p className="text-sm font-bold font-mono text-[#1C1916] flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#947139]" />
              {formattedPhone}
            </p>
          </div>

          {error && (
            <div
              id="otp-error-alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div
              id="otp-success-alert"
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Identity Verified! Phone authentication successful.</span>
            </div>
          )}

          <form onSubmit={handleManualVerify} className="space-y-5">
            {/* 6 Digit Inputs */}
            <div>
              <label className="block text-center text-xs font-semibold text-[#665E55] mb-2 uppercase tracking-wider">
                Enter 6-Digit Code
              </label>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    id={`otp-digit-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isSuccess || isVerifying}
                    className={`w-9 h-11 sm:w-12 sm:h-14 text-center text-base sm:text-xl font-bold font-mono rounded-xl border transition-all text-[#1C1916] ${
                      digit
                        ? 'border-[#947139] bg-[#FAF8F5] ring-2 ring-[#947139]/20'
                        : 'border-[#ECE5D8] bg-white focus:border-[#947139] focus:ring-2 focus:ring-[#947139]/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Timer & Resend */}
            <div className="flex items-center justify-between text-xs text-[#665E55] px-1">
              <span className="flex items-center gap-1 font-medium">
                <Lock className="w-3.5 h-3.5 text-[#948A7D]" />
                Expires in:{' '}
                <span className={`font-mono font-bold ${timeLeft < 30 ? 'text-rose-600' : 'text-[#1C1916]'}`}>
                  {formatTimer(timeLeft)}
                </span>
              </span>

              <button
                id="otp-resend-btn"
                type="button"
                onClick={sendNewOtp}
                disabled={timeLeft > 120 || isVerifying || isSuccess}
                className="font-semibold text-[#947139] hover:text-[#7B5C28] disabled:text-[#948A7D] flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3 h-3" />
                Resend Code {timeLeft > 120 ? `(${timeLeft - 120}s)` : ''}
              </button>
            </div>

            {/* Submit Button */}
            <button
              id="otp-verify-submit-btn"
              type="submit"
              disabled={isVerifying || isSuccess || digits.join('').length < 6}
              className="w-full py-3 rounded-xl bg-[#1C1916] hover:bg-[#2C2723] text-[#FAF8F5] font-semibold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer border border-[#947139]/30"
            >
              {isVerifying ? (
                <div className="w-4 h-4 border-2 border-[#FAF8F5]/30 border-t-[#FAF8F5] rounded-full animate-spin" />
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Successfully</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-[#E6CA85]" />
                  <span>Verify Identity & Proceed</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="bg-[#FAF8F5] px-6 py-3 border-t border-[#ECE5D8] flex items-center justify-between text-[11px] text-[#948A7D]">
          <span>Indian Telecom Compliant (TRAI OTP DLT)</span>
          <span className="font-mono">Demo OTP: 123456</span>
        </div>
      </div>
    </div>
  );
};
