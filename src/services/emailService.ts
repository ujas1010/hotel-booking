import 'dotenv/config';
import nodemailer from 'nodemailer';

// Email transporter singleton
let transporter: any = null;

function getTransporter(): any {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  // 1. Gmail SMTP service
  if (user && pass && (user.includes('@gmail.com') || process.env.GMAIL_USER || process.env.GMAIL_APP_PASSWORD)) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
    return transporter;
  }

  // 2. Custom SMTP host
  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return transporter;
  }

  // Fallback: Direct local / development mail transport or default open relay
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'grand.imperial.palace@ethereal.email',
      pass: 'palaceSecret2026',
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
}

/**
 * Send Royal Palace Password Reset OTP Email
 */
export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
  const normEmail = toEmail.trim().toLowerCase();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset - The Grand Imperial Palace</title>
      <style>
        body { font-family: 'Georgia', serif; background-color: #FBF9F5; color: #1C1916; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #ECE5D8; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #1C1916 0%, #2A1F14 100%); padding: 32px 24px; text-align: center; color: #FAF8F5; }
        .logo-badge { display: inline-block; background: rgba(230, 202, 133, 0.2); border: 1px solid #E6CA85; border-radius: 8px; padding: 4px 10px; color: #E6CA85; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; margin-bottom: 8px; }
        .title { font-size: 22px; font-weight: bold; color: #FAF8F5; margin: 0; }
        .body { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 16px; color: #1C1916; font-weight: 600; margin-bottom: 12px; }
        .text { font-size: 14px; color: #665E55; font-family: sans-serif; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: #FAF8F5; border: 2px dashed #947139; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #947139; font-weight: bold; font-family: sans-serif; margin-bottom: 6px; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1C1916; font-family: 'Courier New', monospace; }
        .validity { font-size: 12px; color: #8C8275; margin-top: 8px; font-family: sans-serif; }
        .footer { background: #FAF8F5; padding: 20px; text-align: center; font-size: 11px; color: #8C8275; font-family: sans-serif; border-top: 1px solid #ECE5D8; }
        .disclaimer { font-size: 12px; color: #8C8275; font-style: italic; font-family: sans-serif; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-badge">The Grand Imperial Palace</div>
          <h1 class="title">Password Reset Verification</h1>
        </div>
        <div class="body">
          <p class="greeting">Dear Valued Patron,</p>
          <p class="text">
            We received a request to reset the password for your Grand Imperial Palace account associated with <strong>${normEmail}</strong>.
          </p>
          
          <div class="otp-box">
            <div class="otp-label">Your 6-Digit Verification Code</div>
            <div class="otp-code">${otpCode}</div>
            <div class="validity">⏱ Valid for the next 10 minutes</div>
          </div>
          
          <p class="text">
            Please enter this code in the password reset window to proceed with setting your new password.
          </p>
          
          <p class="disclaimer">
            If you did not initiate this request, you can safely disregard this email. Your password will remain unchanged and your account secure.
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0 0 4px 0;"><strong>The Grand Imperial Heritage Palace & Luxury Suites</strong></p>
          <p style="margin: 0;">108 Heritage Bay Promenade, Colaba, Mumbai &bull; +91 22 6665 3300</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const mailer = getTransporter();
    const senderUser = (process.env.GMAIL_USER || process.env.SMTP_USER || 'reservations@grandimperialpalace.in').trim();
    const info = await mailer.sendMail({
      from: `"The Grand Imperial Palace" <${senderUser}>`,
      to: normEmail,
      replyTo: senderUser,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
      subject: `[${otpCode}] Grand Imperial Palace - Your Password Reset Verification Code`,
      text: `Your Grand Imperial Palace password reset code is: ${otpCode}. It is valid for 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[Email Service] Password reset OTP email dispatched successfully to ${normEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.warn(`[Email Service Notice] Could not send via primary SMTP (${error.message}).`);
    return { success: false, error: error.message };
  }
}

/**
 * Send Royal Palace Welcome Email to Newly Registered Guests
 */
export async function sendWelcomeEmail(
  toEmail: string,
  userName?: string,
  loyaltyPoints = 100
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const normEmail = toEmail.trim().toLowerCase();
  const displayName = (userName || '').trim() || normEmail.split('@')[0];
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to The Grand Imperial Palace</title>
      <style>
        body { font-family: 'Georgia', serif; background-color: #FBF9F5; color: #1C1916; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #ECE5D8; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,0.07); }
        .header { background: linear-gradient(135deg, #1C1916 0%, #2A1F14 50%, #1C1916 100%); padding: 36px 24px; text-align: center; color: #FAF8F5; }
        .logo-badge { display: inline-block; background: rgba(230, 202, 133, 0.2); border: 1px solid #E6CA85; border-radius: 8px; padding: 5px 12px; color: #E6CA85; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; margin-bottom: 12px; }
        .title { font-size: 24px; font-weight: bold; color: #FAF8F5; margin: 0 0 6px 0; font-family: 'Georgia', serif; }
        .subtitle { font-size: 13px; color: #D5C2A5; margin: 0; font-family: sans-serif; letter-spacing: 0.5px; }
        .body { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 18px; color: #1C1916; font-weight: bold; margin-bottom: 14px; }
        .text { font-size: 14px; color: #554D44; font-family: sans-serif; line-height: 1.65; margin-bottom: 20px; }
        .card { background: linear-gradient(135deg, #FBF8F2 0%, #F5EDE0 100%); border: 1px solid #D9C2A0; border-radius: 12px; padding: 22px; margin: 24px 0; text-align: center; }
        .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8A6428; font-weight: bold; font-family: sans-serif; margin-bottom: 6px; }
        .points-badge { font-size: 28px; font-weight: 900; color: #2A1F14; font-family: 'Georgia', serif; margin: 4px 0; }
        .points-desc { font-size: 12px; color: #7A6F62; font-family: sans-serif; }
        .benefits-grid { margin: 20px 0; text-align: left; }
        .benefit-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-family: sans-serif; font-size: 13px; color: #4A4239; }
        .benefit-icon { color: #A67C37; font-size: 15px; line-height: 1; margin-top: 2px; }
        .btn-wrapper { text-align: center; margin: 28px 0 16px 0; }
        .btn { display: inline-block; background: #78350F; background: linear-gradient(135deg, #78350F 0%, #451A03 100%); color: #FAF8F5 !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: bold; font-size: 14px; font-family: sans-serif; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(120, 53, 15, 0.25); }
        .footer { background: #FAF8F5; padding: 24px 20px; text-align: center; font-size: 11px; color: #8C8275; font-family: sans-serif; border-top: 1px solid #ECE5D8; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-badge">Royal Patron Club</div>
          <h1 class="title">Welcome to Grand Imperial Palace</h1>
          <p class="subtitle">A timeless sanctuary of heritage luxury and regal hospitality</p>
        </div>
        <div class="body">
          <p class="greeting">Dear ${capitalizedName},</p>
          <p class="text">
            We are deeply privileged to welcome you to <strong>The Grand Imperial Palace</strong>. Your patron account has been successfully created, opening the gates to an unrivaled world of historic elegance, bespoke luxury suites, and royal privileges.
          </p>
          
          <div class="card">
            <div class="card-title">VIP Patron Welcome Gift</div>
            <div class="points-badge">+${loyaltyPoints} Royal Loyalty Points</div>
            <div class="points-desc">Instantly credited to your balance for suite upgrades, dining & spa rewards.</div>
          </div>

          <p class="text" style="font-weight: 600; color: #1C1916; margin-bottom: 10px;">
            Your Exclusive Member Privileges:
          </p>
          
          <div class="benefits-grid">
            <div class="benefit-item">
              <span class="benefit-icon">✦</span>
              <span><strong>VIP Priority Check-In</strong> &mdash; Seamless key pickup and luggage handling.</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✦</span>
              <span><strong>Guaranteed Best Heritage Rates</strong> &mdash; Exclusive patron-only discounts on all suites.</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✦</span>
              <span><strong>24/7 Dedicated Palace Concierge</strong> &mdash; Tailored city excursions and private dining reservations.</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✦</span>
              <span><strong>Complimentary High-Speed Fiber Wi-Fi</strong> &amp; luxury welcome refreshments on arrival.</span>
            </div>
          </div>

          <div class="btn-wrapper">
            <a href="${appUrl}" class="btn">Explore Suites &amp; Book Your Stay &rarr;</a>
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0 0 4px 0; font-weight: bold; color: #4A4239;">The Grand Imperial Heritage Palace &amp; Luxury Suites</p>
          <p style="margin: 0 0 8px 0;">108 Heritage Bay Promenade, Colaba, Mumbai 400001 &bull; +91 22 6665 3300</p>
          <p style="margin: 0; color: #A89F93;">You received this email because you created an account on Grand Imperial Palace.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const mailer = getTransporter();
    const senderUser = (process.env.GMAIL_USER || process.env.SMTP_USER || 'reservations@grandimperialpalace.in').trim();
    const info = await mailer.sendMail({
      from: `"The Grand Imperial Palace" <${senderUser}>`,
      to: normEmail,
      replyTo: senderUser,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
      subject: `Welcome to The Grand Imperial Palace, ${capitalizedName} – 100 Loyalty Points Inside`,
      text: `Welcome to The Grand Imperial Palace, ${capitalizedName}! Your account has been credited with 100 bonus loyalty points. Visit ${appUrl} to explore our heritage suites.`,
      html: htmlContent,
    });

    console.log(`[Email Service] Royal Welcome email dispatched successfully to ${normEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.warn(`[Email Service Notice] Could not send welcome email (${error.message}).`);
    return { success: false, error: error.message };
  }
}
