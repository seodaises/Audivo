'use strict';

const nodemailer = require('nodemailer');
const ApiError = require('../utils/ApiError');

const isProduction = process.env.NODE_ENV === 'production';

const getVerificationUrl = (token) => {
  const baseUrl =
    process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

  return `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
};

const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    if (isProduction) {
      throw new ApiError(500, 'Email service is not configured');
    }

    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendVerificationEmail = async ({ to, token }) => {
  const verificationUrl = getVerificationUrl(token);
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`Email verification link for ${to}: ${verificationUrl}`);
    return { sent: false, verificationUrl };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Verify your Audivo email',
    text: `Welcome to Audivo. Verify your email here: ${verificationUrl}`,
    html: `
      <p>Welcome to Audivo.</p>
      <p>Verify your email by opening this link:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });

  return { sent: true };
};
// Reset links point at the FRONTEND (a form to type a new password), not the API.
const getResetUrl = (token) => {
  const frontendUrl =
    process.env.FRONTEND_BASE_URL ||
    process.env.API_BASE_URL ||
    `http://localhost:${process.env.PORT || 5000}`;
  return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

// Mirrors sendVerificationEmail's contract: { sent: false, resetUrl } in dev.
const sendResetPasswordEmail = async ({ to, token }) => {
  const resetUrl = getResetUrl(token);
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`Password reset link for ${to}: ${resetUrl}`);
    return { sent: false, resetUrl };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your Audivo password',
    text: `Reset your Audivo password here: ${resetUrl}`,
    html: `
      <p>We received a request to reset your Audivo password.</p>
      <p>Reset it by opening this link:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 24 hours. If you didn't request this, ignore this email.</p>
    `,
  });

  return { sent: true };
};
module.exports = { sendVerificationEmail, sendResetPasswordEmail };
