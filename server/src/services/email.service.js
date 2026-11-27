import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { z } from 'zod';
import {
  buildRegistrationConfirmationEmail,
  buildPaymentApprovalEmail,
} from '../utils/emailTemplates.js';

const EmailAddressSchema = z.string().trim().email();

let cachedTransporter = null;

/**
 * Check if SMTP credentials are configured in environment variables.
 */
export const isSmtpConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      !process.env.SMTP_USER.includes('your_email') &&
      !process.env.SMTP_PASS.includes('your_app_password')
  );
};

/**
 * Lazily create and reuse a Nodemailer SMTP transporter.
 * Never logs sensitive SMTP credentials.
 */
const getTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (cachedTransporter) {
    return cachedTransporter;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransporter;
};

/**
 * Core safe email sender with recipient validation and non-secret error logging.
 */
export const sendHtmlEmail = async ({ to, subject, html, attachments = [] }) => {
  const parsedEmail = EmailAddressSchema.safeParse(to);
  if (!parsedEmail.success) {
    console.warn('[EmailService] Skipping email: invalid or missing recipient address.');
    return { sent: false, reason: 'invalid_recipient' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.info('[EmailService] SMTP not configured; skipping email delivery.');
    return { sent: false, reason: 'smtp_unconfigured' };
  }

  const from = process.env.SMTP_FROM || `"BAUST Event System" <${process.env.SMTP_USER}>`;

  try {
    const info = await transporter.sendMail({
      from,
      to: parsedEmail.data,
      subject,
      html,
      attachments,
    });
    console.info(`[EmailService] Sent email "${subject}" to ${parsedEmail.data} (messageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Failed to send email "${subject}" to ${parsedEmail.data}: ${err.message}`);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
};

/**
 * Send Registration Confirmation Email after a student submits an event registration.
 */
export const sendRegistrationConfirmationEmail = async (payload) => {
  const { subject, html } = buildRegistrationConfirmationEmail(payload);
  return sendHtmlEmail({
    to: payload.to,
    subject,
    html,
  });
};

/**
 * Send Payment Approval Email with Ticket ID and embedded QR code PNG attachment.
 */
export const sendPaymentApprovalEmail = async (payload) => {
  const qrCid = 'ticket-qr@baust-events';
  const attachments = [];

  if (payload.qrValue) {
    try {
      const qrBuffer = await QRCode.toBuffer(String(payload.qrValue), {
        type: 'png',
        width: 220,
        margin: 2,
        color: {
          dark: '#14213D',
          light: '#FFFFFF',
        },
      });
      attachments.push({
        filename: `${payload.ticketCode || 'ticket'}-qr.png`,
        content: qrBuffer,
        cid: qrCid,
      });
    } catch (qrErr) {
      console.warn(`[EmailService] Could not render QR PNG for ${payload.ticketCode}: ${qrErr.message}`);
    }
  }

  const { subject, html } = buildPaymentApprovalEmail({
    ...payload,
    qrCid: attachments.length > 0 ? qrCid : null,
  });

  return sendHtmlEmail({
    to: payload.to,
    subject,
    html,
    attachments,
  });
};
