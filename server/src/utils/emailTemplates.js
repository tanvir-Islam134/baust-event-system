/**
 * Escape HTML special characters to prevent HTML injection in email templates.
 */
const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Shared responsive BAUST Event System HTML email layout wrapper.
 */
const wrapEmailLayout = ({ preheader, badgeText, badgeBg, badgeColor, heading, bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(15,23,42,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:#14213D;padding:24px 28px;border-bottom:4px solid #FCA311;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#FCA311;">
                BAUST Event System
              </div>
              <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;">
                Bangladesh Army University of Science &amp; Technology
              </div>
            </td>
          </tr>

          <!-- Status Badge & Title -->
          <tr>
            <td style="padding:28px 28px 12px 28px;">
              <span style="display:inline-block;padding:5px 12px;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.6px;background-color:${badgeBg};color:${badgeColor};">
                ${escapeHtml(badgeText)}
              </span>
              <h1 style="margin:14px 0 0 0;font-size:22px;line-height:1.3;font-weight:800;color:#14213D;">
                ${escapeHtml(heading)}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:8px 28px 28px 28px;font-size:14px;line-height:1.6;color:#334155;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:18px 28px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;">
              <div style="font-weight:700;color:#14213D;">BAUST Official Campus Event Portal</div>
              <div style="margin-top:4px;">Saidpur Cantonment, Nilphamari, Bangladesh</div>
              <div style="margin-top:6px;font-size:11px;color:#94a3b8;">
                This is an automated notification. Please do not reply directly to this email.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Email 1: Registration Confirmation Email (sent upon successful registration submission).
 */
export const buildRegistrationConfirmationEmail = ({
  studentName,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
  clubName,
  ticketCode,
  paymentMethod,
  trxId,
  amount,
}) => {
  const feeText = Number(amount) > 0 ? `BDT ${Number(amount).toLocaleString()}` : 'Free';
  const subject = `Registration Received: ${eventName}`;

  const bodyHtml = `
    <p style="margin:0 0 14px 0;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    <p style="margin:0 0 18px 0;">
      Your registration for <strong>${escapeHtml(eventName)}</strong> has been successfully submitted and is currently awaiting Organizer verification.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:18px;">
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;width:40%;">Event</td>
        <td style="padding:6px 0;font-size:13px;font-weight:700;color:#14213D;">${escapeHtml(eventName)}</td>
      </tr>
      ${clubName ? `<tr><td style="padding:6px 0;font-size:12px;color:#64748b;">Organized By</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#14213D;">${escapeHtml(clubName)}</td></tr>` : ''}
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;">Date &amp; Time</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">${escapeHtml(eventDate || 'TBA')}${eventTime ? ` • ${escapeHtml(eventTime)}` : ''}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;">Venue</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">${escapeHtml(eventVenue || 'TBA')}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;">Fee &amp; Method</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">${escapeHtml(feeText)} (${escapeHtml((paymentMethod || 'cash').toUpperCase())})</td>
      </tr>
      ${trxId ? `<tr><td style="padding:6px 0;font-size:12px;color:#64748b;">bKash TrxID</td><td style="padding:6px 0;font-size:13px;font-family:monospace;font-weight:700;color:#be185d;">${escapeHtml(trxId)}</td></tr>` : ''}
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;">Reference Ticket ID</td>
        <td style="padding:6px 0;font-size:13px;font-family:monospace;font-weight:700;color:#14213D;">${escapeHtml(ticketCode)}</td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#475569;">
      Once the Organizer verifies your registration and payment, you will receive another email with your approved Digital Entry Pass and QR code.
    </p>
  `;

  const html = wrapEmailLayout({
    preheader: `Registration submitted for ${eventName}. Reference: ${ticketCode}`,
    badgeText: 'Registration Submitted • Pending Review',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
    heading: `Registration Received for ${eventName}`,
    bodyHtml,
  });

  return { subject, html };
};

/**
 * Email 2: Payment & Registration Approval Confirmation Email (includes Ticket ID & QR Code).
 */
export const buildPaymentApprovalEmail = ({
  studentName,
  studentId,
  department,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
  clubName,
  ticketCode,
  paymentMethod,
  trxId,
  amount,
  qrCid = null,
}) => {
  const feeText = Number(amount) > 0 ? `BDT ${Number(amount).toLocaleString()}` : 'Free';
  const subject = `Approved Entry Pass & QR Ticket: ${eventName}`;

  const bodyHtml = `
    <p style="margin:0 0 14px 0;">Congratulations <strong>${escapeHtml(studentName)}</strong>,</p>
    <p style="margin:0 0 18px 0;">
      Your payment and registration for <strong>${escapeHtml(eventName)}</strong> have been <strong>approved</strong> by the Organizer. Present the Ticket ID or QR code below at the event gate for check-in.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:18px;">
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;width:40%;">Student Name</td>
        <td style="padding:6px 0;font-size:13px;font-weight:700;color:#14213D;">${escapeHtml(studentName)}</td>
      </tr>
      ${studentId ? `<tr><td style="padding:6px 0;font-size:12px;color:#64748b;">Student ID</td><td style="padding:6px 0;font-size:13px;font-family:monospace;font-weight:600;color:#1e293b;">${escapeHtml(studentId)}</td></tr>` : ''}
      ${department ? `<tr><td style="padding:6px 0;font-size:12px;color:#64748b;">Department</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">${escapeHtml(department)}</td></tr>` : ''}
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;">Event</td>
        <td style="padding:6px 0;font-size:13px;font-weight:700;color:#14213D;">${escapeHtml(eventName)}</td>
      </tr>
      ${clubName ? `<tr><td style="padding:6px 0;font-size:12px;color:#64748b;">Organized By</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#14213D;">${escapeHtml(clubName)}</td></tr>` : ''}
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;">Date &amp; Time</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">${escapeHtml(eventDate || 'TBA')}${eventTime ? ` • ${escapeHtml(eventTime)}` : ''}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;">Venue</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">${escapeHtml(eventVenue || 'TBA')}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;">Payment Confirmed</td>
        <td style="padding:6px 0;font-size:13px;font-weight:700;color:#047857;">${escapeHtml(feeText)} • ${escapeHtml((paymentMethod || 'cash').toUpperCase())}${trxId ? ` (TrxID: ${escapeHtml(trxId)})` : ''}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;">Official Ticket ID</td>
        <td style="padding:6px 0;font-size:14px;font-family:monospace;font-weight:800;color:#14213D;">${escapeHtml(ticketCode)}</td>
      </tr>
    </table>

    ${
      qrCid
        ? `
    <div style="text-align:center;background-color:#14213D;border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#FCA311;margin-bottom:10px;">
        Gate Check-In QR Pass
      </div>
      <div style="display:inline-block;background-color:#ffffff;padding:10px;border-radius:10px;">
        <img src="cid:${escapeHtml(qrCid)}" alt="Event Entry QR Code" width="180" height="180" style="display:block;border:0;" />
      </div>
      <div style="font-size:12px;font-family:monospace;font-weight:700;color:#ffffff;margin-top:10px;">
        ${escapeHtml(ticketCode)}
      </div>
    </div>`
        : ''
    }

    <p style="margin:0;font-size:13px;color:#475569;">
      You can also view and download your pass anytime from your Student Dashboard under <strong>My Registered Passes &amp; Tickets</strong>.
    </p>
  `;

  const html = wrapEmailLayout({
    preheader: `Your entry pass for ${eventName} is approved! Ticket ID: ${ticketCode}`,
    badgeText: 'Payment Approved • Entry Pass Ready',
    badgeBg: '#D1FAE5',
    badgeColor: '#065F46',
    heading: `You're In! ${eventName}`,
    bodyHtml,
  });

  return { subject, html };
};
