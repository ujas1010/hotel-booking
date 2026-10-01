import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RotateCw,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot_password';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const {
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    sendForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resetPasswordWithOtp,
    refreshProfile,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  const [forgotStep, setForgotStep] = useState<'request_otp' | 'verify_otp' | 'set_new_password'>('request_otp');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password specific states
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset all form inputs and sync mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setForgotStep('request_otp');
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setError(null);
      setSuccessMsg(null);
      setDemoOtp(null);
      setResetToken(null);
    }
  }, [isOpen, initialMode]);

  // Listen to logout / auth state changes to clear all inputs
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (!e.detail?.user) {
        setEmail('');
        setPassword('');
        setName('');
        setPhone('');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError(null);
        setSuccessMsg(null);
        setDemoOtp(null);
      }
    };
    window.addEventListener('auth:change', handleAuthChange);
    return () => window.removeEventListener('auth:change', handleAuthChange);
  }, []);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleModalClose = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleLoginOrSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (password.length < 5) {
          setError('Password must be at least 5 characters long.');
          setLoading(false);
          return;
        }

        if (phone.trim()) {
          const cleanPhone = phone.replace(/\D/g, '');
          if (cleanPhone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number.');
            setLoading(false);
            return;
          }
        }

        const res = await signUpWithEmail({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim() ? `+91 ${phone.replace(/\D/g, '')}` : undefined,
        });

        if (!res.success) {
          setError(res.error || 'Failed to create account.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Account created successfully! Welcome to The Grand Imperial Palace.');
      } else {
        const res = await loginWithEmail({
          email: email.trim(),
          password: password.trim(),
        });

        if (!res.success) {
          setError(res.error || 'Invalid email or password.');
          setLoading(false);
          return;
        }

        setSuccessMsg(res.isAdmin ? 'Welcome, Palace Administrator.' : 'Signed in successfully!');
      }

      await refreshProfile();

      setTimeout(() => {
        setLoading(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setDemoOtp(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendForgotPasswordOtp(email.trim());
      if (!res.success) {
        setError(res.error || 'Failed to send verification code.');
        setLoading(false);
        return;
      }

      setMaskedEmail(res.maskedEmail || email);
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setSuccessMsg(res.message || 'Verification code sent to your email.');
      setForgotStep('verify_otp');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await sendForgotPasswordOtp(email.trim());
      if (res.success) {
        if (res.demoOtp) setDemoOtp(res.demoOtp);
        if (res.resetToken) setResetToken(res.resetToken);
        setSuccessMsg('A fresh verification code has been dispatched.');
        setResendTimer(60);
      } else {
        setError(res.error || 'Failed to resend code.');
      }
    } catch (err: any) {
      setError(err.message || 'Error resending code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyForgotPasswordOtp(email.trim(), otpCode.trim(), resetToken || undefined);
      if (!res.success) {
        setError(res.error || 'Invalid or expired verification code.');
        setLoading(false);
        return;
      }

      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setSuccessMsg('Verification code confirmed! Please create your new password.');
      setForgotStep('set_new_password');
    } catch (err: any) {
      setError(err.message || 'Error verifying code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!newPassword || newPassword.length < 5) {
      setError('New password must be at least 5 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordWithOtp(email.trim(), otpCode.trim(), newPassword.trim(), resetToken || undefined);
      if (!res.success) {
        setError(res.error || 'Failed to reset password.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Your password has been changed successfully! Redirecting to sign in...');
      setPassword(newPassword); // prefill password for convenient login

      setTimeout(() => {
        setMode('login');
        setForgotStep('request_otp');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setDemoOtp(null);
        setResetToken(null);
        setError(null);
        setSuccessMsg('Password updated! You can now sign in with your new password.');
        setLoading(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error resetting password.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      setLoading(true);
      await loginWithGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setError(err.message || 'Google sign-in could not be completed. Please try again or use Email & Password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-amber-900/10 overflow-hidden"
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 px-6 py-5 text-white relative shrink-0">
          <button
            id="auth-modal-close-btn"
            onClick={handleModalClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-serif font-bold text-xs">
              GI
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-300/90 font-serif">
              The Grand Imperial Palace
            </span>
          </div>

          <h2 className="text-xl font-serif font-bold tracking-tight text-amber-50">
            {mode === 'login'
              ? 'Sign In to Your Account'
              : mode === 'signup'
              ? 'Create Guest Account'
              : forgotStep === 'request_otp'
              ? 'Reset Your Password'
              : forgotStep === 'verify_otp'
              ? 'Enter Verification Code'
              : 'Set New Password'}
          </h2>
          <p className="text-xs text-stone-300 mt-1">
            {mode === 'login'
              ? 'Access reservations, VIP benefits, and manage palace stays.'
              : mode === 'signup'
              ? 'Join our VIP Patron Club and earn 100 bonus loyalty points.'
              : forgotStep === 'request_otp'
              ? 'Enter your registered email address to receive a 6-digit OTP code.'
              : forgotStep === 'verify_otp'
              ? `Enter the 6-digit code sent to ${maskedEmail || email}.`
              : 'Create and confirm your new secure password.'}
          </p>
        </div>

        {/* Tab switchers (only visible for login/signup) */}
        {mode !== 'forgot_password' ? (
          <div className="flex border-b border-stone-200 bg-stone-50/80 p-1 shrink-0">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="border-b border-stone-200 bg-stone-50 px-6 py-2.5 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                if (forgotStep === 'set_new_password') {
                  setForgotStep('verify_otp');
                } else if (forgotStep === 'verify_otp') {
                  setForgotStep('request_otp');
                } else {
                  setMode('login');
                  setForgotStep('request_otp');
                }
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {forgotStep === 'set_new_password'
                ? 'Back to Code'
                : forgotStep === 'verify_otp'
                ? 'Change Email'
                : 'Back to Sign In'}
            </button>
            <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider font-mono">
              {forgotStep === 'request_otp'
                ? 'Step 1 of 3: Email'
                : forgotStep === 'verify_otp'
                ? 'Step 2 of 3: Code'
                : 'Step 3 of 3: Password'}
            </span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Alerts */}
          {error && (
            <div
              id="auth-error-alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {(mode === 'login' || mode === 'forgot_password') && (error.toLowerCase().includes('sign up') || error.toLowerCase().includes('no account found') || error.toLowerCase().includes('not register')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="block mt-1.5 font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                  >
                    Click here to Create Account &rarr;
                  </button>
                )}
                {mode === 'signup' && (error.toLowerCase().includes('sign in') || error.toLowerCase().includes('already exists')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="block mt-1.5 font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                  >
                    Click here to Sign In &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div
              id="auth-success-alert"
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in duration-150"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}



          {/* Quick Demo Credentials Autofill (Only on Login) */}
          {mode === 'login' && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl space-y-1.5 text-xs text-stone-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-950 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  Quick Demo Logins
                </span>
                <span className="text-[10px] text-stone-600">Click to fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('guest@grandimperialpalace.in');
                    setPassword('guest123');
                    setError(null);
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-amber-100/50 border border-amber-300/80 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-semibold text-stone-900 text-[11px]">Royal Patron</p>
                  <p className="text-[10px] text-stone-600 font-mono">guest123</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@grandimperialpalace.in');
                    setPassword('ImperialAdmin');
                    setError(null);
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-amber-100/50 border border-amber-300/80 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-semibold text-stone-900 text-[11px]">Palace Admin</p>
                  <p className="text-[10px] text-stone-600 font-mono">ImperialAdmin</p>
                </button>
              </div>
            </div>
          )}

          {/* LOGIN & SIGNUP FORMS */}
          {mode !== 'forgot_password' && (
            <form onSubmit={handleLoginOrSignup} className="space-y-3.5">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="signup-name-input"
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-all text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-stone-700">
                        Mobile Number (Optional)
                      </label>
                      <span className="text-[10px] text-stone-500">10 Digits</span>
                    </div>
                    <div className="flex rounded-xl border border-stone-300 overflow-hidden focus-within:ring-2 focus-within:ring-amber-800/20 focus-within:border-amber-800 transition-all bg-white">
                      <span className="inline-flex items-center px-3 text-xs font-medium text-stone-600 bg-stone-100 border-r border-stone-300 select-none">
                        +91
                      </span>
                      <input
                        id="signup-phone-input"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full px-3 py-2.5 text-sm focus:outline-none text-stone-900 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-all text-stone-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      id="auth-forgot-password-link"
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setForgotStep('request_otp');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-amber-900 hover:text-amber-950 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={mode === 'signup' ? 'At least 5 characters' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-all text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-50 font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-amber-200/40 border-t-amber-200 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to Account' : 'Create Palace Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM: STEP 1 (REQUEST OTP) */}
          {mode === 'forgot_password' && forgotStep === 'request_otp' && (
            <form onSubmit={handleSendForgotOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    placeholder="Enter your registered email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-all text-stone-900"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  We'll send a 6-digit verification code to verify your identity.
                </p>
              </div>

              <button
                id="forgot-send-otp-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-50 font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-amber-200/40 border-t-amber-200 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM: STEP 2 (ENTER & VERIFY OTP CODE) */}
          {mode === 'forgot_password' && forgotStep === 'verify_otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    6-Digit Verification Code <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                    className="text-xs text-amber-900 hover:underline font-semibold disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    required
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-all text-stone-900 font-bold"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  Enter the 6-digit verification code sent to <span className="font-semibold text-stone-700">{maskedEmail || email}</span>.
                </p>
              </div>

              <button
                id="forgot-verify-otp-btn"
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-50 font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-amber-200/40 border-t-amber-200 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Code & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM: STEP 3 (ENTER NEW PASSWORD) */}
          {mode === 'forgot_password' && forgotStep === 'set_new_password' && (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-new-password-input"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="At least 5 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-all text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-all text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="forgot-reset-btn"
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full py-3 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-50 font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-amber-200/40 border-t-amber-200 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Reset & Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Social Sign-In (Only on Login/Signup) */}
          {mode !== 'forgot_password' && (
            <>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-stone-400 font-medium">Or continue with</span>
                </div>
              </div>

              <button
                id="auth-google-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-medium text-xs flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}
        </div>

        {/* Footer switch prompt */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-center text-xs text-stone-600">
          {mode === 'login' ? (
            <p>
              New guest at Grand Imperial?{' '}
              <button
                id="auth-switch-to-signup"
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="font-semibold text-amber-900 hover:underline cursor-pointer"
              >
                Sign up for an account
              </button>
            </p>
          ) : mode === 'signup' ? (
            <p>
              Already registered with us?{' '}
              <button
                id="auth-switch-to-login"
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-semibold text-amber-900 hover:underline cursor-pointer"
              >
                Sign in to your account
              </button>
            </p>
          ) : (
            <p>
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setForgotStep('request_otp');
                  setError(null);
                }}
                className="font-semibold text-amber-900 hover:underline cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
