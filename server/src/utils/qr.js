import jwt from 'jsonwebtoken';

const getQrSecret = () => {
  return process.env.QR_SIGNING_SECRET || process.env.JWT_SECRET || 'baust_qr_secure_token_secret_2026';
};

/**
 * Generate a cryptographically signed ticket payload for QR code generation.
 * @param {object} registration
 * @param {object} [event]
 * @returns {string} Signed JWT token string
 */
export const signTicketQr = (registration, event = {}) => {
  const secret = getQrSecret();
  const payload = {
    regId: registration.id,
    eventId: registration.eventId,
    ticketCode: registration.ticketCode,
    userId: registration.userId || null,
    guestEmail: registration.guest?.email || null,
    eventTitle: event.title || event.eventName || 'BAUST Event',
    purpose: 'baust_ticket_gate_checkin',
  };

  // Valid for 60 days
  return jwt.sign(payload, secret, { expiresIn: '60d' });
};

/**
 * Verify and decode an incoming ticket QR code payload string.
 * @param {string} qrToken
 * @returns {object} Decoded payload
 */
export const verifyTicketQr = (qrToken) => {
  if (!qrToken || typeof qrToken !== 'string') {
    throw new Error('Invalid ticket QR code format');
  }

  const secret = getQrSecret();
  try {
    const decoded = jwt.verify(qrToken.trim(), secret);
    if (decoded.purpose !== 'baust_ticket_gate_checkin') {
      throw new Error('Invalid ticket: Token not designated for event entry.');
    }
    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Ticket Expired: This QR code has expired.');
    }
    throw new Error('Counterfeit or Invalid Ticket: Cryptographic signature mismatch.');
  }
};
