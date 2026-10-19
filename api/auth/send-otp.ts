import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Shared OTP secret
const OTP_SECRET = process.env.OTP_SECRET || 'gst-invoice-studio-otp-secret-key-2026';

// Gmail SMTP Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'Saurabh.antworksmoney@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'udwqymfgugqaleoo',
  },
});

export default async function handler(req: any, res: any) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const identifier = (body.identifier || '').trim().toLowerCase();

    if (!identifier) {
      return res.status(400).json({ error: 'Mobile number or Email address is required' });
    }

    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Generate verifiable HMAC token so verification works across serverless lambdas
    const dataToSign = `${identifier}:${otpCode}:${expiresAt}`;
    const token = crypto.createHmac('sha256', OTP_SECRET).update(dataToSign).digest('hex') + '.' + expiresAt;

    const isEmail = identifier.includes('@');
    if (isEmail) {
      // Send real email via Gmail SMTP
      await transporter.sendMail({
        from: '"GST Invoice Studio" <Saurabh.antworksmoney@gmail.com>',
        to: identifier,
        subject: `🔑 Your GST Studio OTP: ${otpCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2563eb; margin: 0; font-size: 22px; font-weight: 800;">GST Invoice Studio</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Cloud Invoicing & Shop Management</p>
            </div>
            <p style="color: #334155; font-size: 14px; margin: 0 0 8px;">Hello Business Owner,</p>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
              Your one-time verification code (OTP) for accessing your GST billing workspace is:
            </p>
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%); padding: 18px; text-align: center; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; margin: 16px 0; border: 1px dashed #3b82f6;">
              ${otpCode}
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 12px 0 0;">
              ⏱️ This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0 12px;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
              © 2026 GST Invoice Studio • Multi-Shop SaaS Platform
            </p>
          </div>
        `,
      });
      console.log(`[Vercel Serverless] Sent OTP email to ${identifier}`);
    } else {
      console.log(`[Vercel Serverless] Mobile identifier ${identifier}: ${otpCode}`);
    }

    return res.status(200).json({
      message: isEmail
        ? `OTP has been sent to your email (${identifier}). Please check your inbox or spam folder.`
        : `OTP sent successfully to mobile (${identifier})! (Demo code: ${otpCode})`,
      token: token,
      demoOtp: otpCode,
    });
  } catch (error: any) {
    console.error('[Vercel Serverless] Error sending OTP:', error);
    return res.status(500).json({
      error: `Failed to send email: ${error.message || 'SMTP connection error'}. You can still use Demo OTP: 123456`,
      demoOtp: '123456',
    });
  }
}
