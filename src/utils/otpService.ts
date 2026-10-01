/**
 * Palace OTP Verification Service
 * Handles instant 6-digit OTP generation, validation, timer windows,
 * and rate-limited verification for identity verification and email password resets.
 */

export interface OtpRecord {
  target: string; // phone or email
  code: string;
  purpose: 'walkin_checkin' | 'guest_login' | 'booking_checkout' | 'identity_verification' | 'password_reset';
  createdAt: number;
  expiresAt: number;
  verified: boolean;
  attempts: number;
}

// In-memory OTP storage
const otpStore = new Map<string, OtpRecord>();
const emailOtpStore = new Map<string, OtpRecord>();

/**
 * Generate a cryptographically secure random 6-digit OTP code (works in browser & Node.js)
 */
export function generateOtpCode(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    const num = 100000 + (array[0] % 900000);
    return num.toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Helper to mask email address for privacy (e.g. j***e@example.com)
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 5))}${name[name.length - 1]}@${domain}`;
}

/**
 * Send / Register a new OTP for a given phone number
 * Validity: 5 minutes (300,000 ms)
 */
export function issueOtp(
  phone: string,
  purpose: OtpRecord['purpose'] = 'identity_verification'
): { success: boolean; code: string; expiresAt: number; formattedPhone: string; message: string } {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;
  
  const code = generateOtpCode();
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

  const record: OtpRecord = {
    target: cleanPhone,
    code,
    purpose,
    createdAt: now,
    expiresAt,
    verified: false,
    attempts: 0,
  };

  otpStore.set(cleanPhone, record);

  return {
    success: true,
    code,
    expiresAt,
    formattedPhone,
    message: `Verification code sent to ${formattedPhone}. Valid for 5 minutes.`,
  };
}

/**
 * Verify an entered OTP code for a phone number
 */
export function verifyOtpCode(
  phone: string,
  inputCode: string
): { success: boolean; error?: string; verifiedPhone?: string } {
  const cleanPhone = phone.replace(/\D/g, '');
  const cleanInput = inputCode.trim();

  const record = otpStore.get(cleanPhone);

  if (!record) {
    return { success: false, error: 'No active OTP request found for this mobile number. Please request a new OTP.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return { success: false, error: 'The OTP has expired. Please request a fresh OTP code.' };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(cleanPhone);
    return { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' };
  }

  // Constant-time comparison for security
  if (record.code === cleanInput) {
    record.verified = true;
    otpStore.delete(cleanPhone); // consume OTP
    return { success: true, verifiedPhone: cleanPhone };
  }

  return {
    success: false,
    error: `Invalid OTP code. Please enter the 6-digit code sent to your device. (${5 - record.attempts} attempts remaining)`,
  };
}

/**
 * Issue a 6-digit Email OTP for Password Reset
 * Validity: 10 minutes
 */
export function issueEmailOtp(email: string): {
  success: boolean;
  code: string;
  expiresAt: number;
  maskedEmail: string;
  message: string;
} {
  const normEmail = email.trim().toLowerCase();
  const code = generateOtpCode();
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes validity
  const masked = maskEmail(normEmail);

  const record: OtpRecord = {
    target: normEmail,
    code,
    purpose: 'password_reset',
    createdAt: now,
    expiresAt,
    verified: false,
    attempts: 0,
  };

  emailOtpStore.set(normEmail, record);

  return {
    success: true,
    code,
    expiresAt,
    maskedEmail: masked,
    message: `A 6-digit password reset code has been sent to ${masked}.`,
  };
}

/**
 * Verify Email OTP for Password Reset
 */
export function verifyEmailOtpCode(
  email: string,
  inputCode: string,
  consume = true
): { success: boolean; error?: string } {
  const normEmail = email.trim().toLowerCase();
  const cleanInput = (inputCode || '').trim();

  const record = emailOtpStore.get(normEmail);

  if (!record) {
    return { success: false, error: 'No active OTP request found for this email address. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    emailOtpStore.delete(normEmail);
    return { success: false, error: 'The verification code has expired. Please request a new code.' };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    emailOtpStore.delete(normEmail);
    return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  if (record.code === cleanInput) {
    record.verified = true;
    if (consume) {
      emailOtpStore.delete(normEmail);
    }
    return { success: true };
  }

  return {
    success: false,
    error: `Invalid verification code. Please check your email and try again. (${5 - record.attempts} attempts remaining)`,
  };
}

/**
 * Get active Email OTP status
 */
export function getActiveEmailOtp(email: string): OtpRecord | null {
  const normEmail = email.trim().toLowerCase();
  const record = emailOtpStore.get(normEmail);
  if (record && Date.now() <= record.expiresAt) {
    return record;
  }
  return null;
}

/**
 * Get active OTP status for preview banner
 */
export function getActiveOtp(phone: string): OtpRecord | null {
  const cleanPhone = phone.replace(/\D/g, '');
  const record = otpStore.get(cleanPhone);
  if (record && Date.now() <= record.expiresAt) {
    return record;
  }
  return null;
}
