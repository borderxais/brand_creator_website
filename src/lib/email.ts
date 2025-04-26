import nodemailer from 'nodemailer';

// SMTP transport configuration
// You'll need to add these environment variables to your .env file
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Boolean(process.env.SMTP_SECURE === 'true'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Default sender information
const defaultSender = {
  name: 'Brand Creator Platform',
  email: 'rucheng@borderxai.com',
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using the configured SMTP transport
 */
export async function sendEmail({ to, subject, html, from }: EmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: from || `"${defaultSender.name}" <${defaultSender.email}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a verification email with a token link
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<boolean> {
  const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 40px; text-align: center; background-color: #6d28d9; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Brand Creator Platform</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 20px;">Verify Your Email Address</h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    Thank you for signing up! To complete your registration and access all features, please verify your email address.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" target="_blank" style="background-color: #6d28d9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                      Verify Email Address
                    </a>
                  </div>
                  
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    If the button doesn't work, you can copy and paste this link into your browser:
                  </p>
                  
                  <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin-bottom: 24px; background-color: #f3f4f6; padding: 12px; border-radius: 4px; word-break: break-all;">
                    ${verificationLink}
                  </p>
                  
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    <strong>Important:</strong> This link will expire in 24 hours for security reasons.
                  </p>
                  
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    After verification, you'll be able to log in and start using all platform features.
                  </p>
                  
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                    If you didn't create an account with us, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    © ${new Date().getFullYear()} Brand Creator Platform. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address',
    html,
  });
}
