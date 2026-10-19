const nodemailer = require('nodemailer');

/**
 * Configure Transporter automatically based on .env configuration
 */
const createTransporter = async () => {
  // 1. Gmail Setup
  if (process.env.EMAIL_SERVICE === 'gmail' || (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com'))) {
    console.log('📧 Using Gmail Transporter');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // 16-character Gmail App Password
      },
    });
  }

  // 2. Custom SMTP Setup (SendGrid, Brevo, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log(`📧 Using Custom SMTP Transporter (${process.env.SMTP_HOST})`);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // 3. Fallback to Ethereal Test Account
  const testAccount = await nodemailer.createTestAccount();
  console.log('📧 Using Ethereal Test SMTP credentials');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

/**
 * Send Automated Email Notification for Missing Documents
 */
const sendMissingDocumentEmail = async (vendorEmail, companyName, missingDocs) => {
  try {
    const transporter = await createTransporter();

    const missingListHtml = missingDocs.map(doc => `<li style="margin-bottom: 5px;"><strong>${doc}</strong></li>`).join('');

    const senderEmail = process.env.EMAIL_USER || 'noreply@vendorverify.com';

    const mailOptions = {
      from: `"Vendor Verification Team" <${senderEmail}>`,
      to: vendorEmail,
      subject: `Action Required: Missing Documents for ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #dc2626; margin-top: 0;">Vendor Onboarding Action Required</h2>
          <p style="font-size: 14px; color: #4b5563;">Dear Representative,</p>
          <p style="font-size: 14px; color: #4b5563;">We are currently conducting compliance verification for <strong>${companyName}</strong>. The following required document(s) are missing from your profile:</p>
          
          <ul style="color: #b91c1c; font-size: 14px; background: #fef2f2; padding: 16px 32px; border-radius: 8px; border: 1px solid #fecaca;">
            ${missingListHtml}
          </ul>

          <p style="font-size: 14px; color: #4b5563;">Please log in to your vendor portal and submit the requested documents to finalize your verification.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">Best Regards,<br/><strong>Vendor Compliance & Verification Operations</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Real Email Sent Successfully. Message ID:', info.messageId);

    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Email Sending Error:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendMissingDocumentEmail };