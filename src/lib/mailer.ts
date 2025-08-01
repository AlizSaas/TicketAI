'use server'
import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

// Configure your email service
const transporter = nodemailer.createTransport({
  service:  'gmail', // e.g., 'gmail', 'sendgrid'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls:{
    rejectUnauthorized: false, // This is important for self-signed certificates
  } // Uncomment this line if you are using a self-signed certificate
});

export async function sendEmail({ to, subject, html }: MailOptions) {
  try {
    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}