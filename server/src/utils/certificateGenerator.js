import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Center-align helper for pdf-lib text drawing.
 */
const drawCenteredText = (page, text, y, font, size, color) => {
  const safeText = String(text || '').replace(/[^\x20-\x7E]/g, ' ');
  const textWidth = font.widthOfTextAtSize(safeText, size);
  const { width } = page.getSize();
  page.drawText(safeText, {
    x: Math.max(40, (width - textWidth) / 2),
    y,
    size,
    font,
    color,
  });
};

/**
 * Format YYYY-MM-DD or Date into readable certificate date string.
 */
const formatCertificateDate = (rawDate) => {
  if (!rawDate) return 'Date N/A';
  try {
    let clean = String(rawDate).trim();
    if (clean.startsWith('26444-')) clean = clean.replace('26444-', '2026-');
    const parsed = new Date(clean);
    if (isNaN(parsed.getTime())) return clean;
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return String(rawDate);
  }
};

/**
 * Dynamically generate a landscape A4 PDF Participation Certificate using pdf-lib.
 * Uses verified student and event details retrieved from the database.
 *
 * @param {object} data
 * @param {string} data.certificateId
 * @param {string} data.studentName
 * @param {string|null} [data.studentId]
 * @param {string|null} [data.department]
 * @param {string} data.eventName
 * @param {string} data.eventDate
 * @param {string|null} [data.eventVenue]
 * @param {string|null} [data.clubName]
 * @param {string|null} [data.organizerName]
 * @param {Date|string} [data.issuedAt]
 * @returns {Promise<Uint8Array>}
 */
export const generateCertificatePdf = async ({
  certificateId,
  studentName,
  studentId = null,
  department = null,
  eventName,
  eventDate,
  eventVenue = null,
  clubName = null,
  organizerName = null,
  issuedAt = new Date(),
}) => {
  const pdfDoc = await PDFDocument.create();
  // Landscape A4: 841.89 x 595.28 points
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(20 / 255, 33 / 255, 61 / 255); // #14213D
  const gold = rgb(252 / 255, 163 / 255, 17 / 255); // #FCA311
  const slate = rgb(71 / 255, 85 / 255, 105 / 255);
  const darkText = rgb(15 / 255, 23 / 255, 42 / 255);
  const creamBg = rgb(253 / 255, 252 / 255, 248 / 255);

  // Background fill
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: creamBg,
  });

  // Outer Navy Frame
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: navy,
    borderWidth: 4,
  });

  // Inner Gold Accent Frame
  page.drawRectangle({
    x: 34,
    y: 34,
    width: width - 68,
    height: height - 68,
    borderColor: gold,
    borderWidth: 1.5,
  });

  // Top Navy Header Banner
  page.drawRectangle({
    x: 34,
    y: height - 104,
    width: width - 68,
    height: 70,
    color: navy,
  });

  drawCenteredText(
    page,
    'BANGLADESH ARMY UNIVERSITY OF SCIENCE AND TECHNOLOGY (BAUST)',
    height - 66,
    fontSansBold,
    13,
    rgb(1, 1, 1)
  );
  drawCenteredText(
    page,
    'Saidpur Cantonment, Nilphamari  |  Official Campus Event Portal',
    height - 86,
    fontSans,
    10,
    gold
  );

  // Main Certificate Title
  drawCenteredText(
    page,
    'CERTIFICATE OF PARTICIPATION',
    height - 158,
    fontSerifBold,
    30,
    navy
  );

  // Decorative Gold Divider
  page.drawLine({
    start: { x: width / 2 - 140, y: height - 172 },
    end: { x: width / 2 + 140, y: height - 172 },
    thickness: 2,
    color: gold,
  });

  drawCenteredText(
    page,
    'This is proudly presented to',
    height - 208,
    fontSerifItalic,
    15,
    slate
  );

  // Verified Student Full Name
  drawCenteredText(page, studentName || 'BAUST Student', height - 252, fontSerifBold, 32, darkText);

  // Student ID & Department subtitle
  const cohortParts = [];
  if (studentId) cohortParts.push(`Student ID: ${studentId}`);
  if (department) cohortParts.push(`Department: ${department}`);
  if (cohortParts.length > 0) {
    drawCenteredText(page, cohortParts.join('   |   '), height - 278, fontSans, 11, slate);
  }

  // Event Participation Statement
  drawCenteredText(
    page,
    'for active participation and verified attendance in the campus event',
    height - 314,
    fontSans,
    13,
    slate
  );

  drawCenteredText(page, eventName || 'BAUST Campus Event', height - 350, fontSansBold, 20, navy);

  const eventMetaParts = [`Held on ${formatCertificateDate(eventDate)}`];
  if (eventVenue) eventMetaParts.push(`at ${eventVenue}`);
  drawCenteredText(page, eventMetaParts.join(' '), height - 376, fontSans, 12, slate);

  if (clubName) {
    drawCenteredText(page, `Organized by ${clubName}`, height - 398, fontSansBold, 11, gold);
  }

  // Bottom Signature & Verification Area
  const sigY = 105;
  // Left signature line: Organizer / Club
  page.drawLine({
    start: { x: 90, y: sigY },
    end: { x: 290, y: sigY },
    thickness: 1,
    color: navy,
  });
  page.drawText(organizerName || clubName || 'Event Organizer', {
    x: 90,
    y: sigY - 16,
    size: 10,
    font: fontSansBold,
    color: navy,
  });
  page.drawText('Authorized Event Organizer', {
    x: 90,
    y: sigY - 30,
    size: 9,
    font: fontSans,
    color: slate,
  });

  // Right signature line: BAUST Event Portal
  page.drawLine({
    start: { x: width - 290, y: sigY },
    end: { x: width - 90, y: sigY },
    thickness: 1,
    color: navy,
  });
  page.drawText('BAUST Event System', {
    x: width - 290,
    y: sigY - 16,
    size: 10,
    font: fontSansBold,
    color: navy,
  });
  page.drawText(`Issued: ${formatCertificateDate(issuedAt)}`, {
    x: width - 290,
    y: sigY - 30,
    size: 9,
    font: fontSans,
    color: slate,
  });

  // Footer Certificate ID
  drawCenteredText(
    page,
    `Certificate ID: ${certificateId}   •   Verified Attendance Record`,
    48,
    fontSansBold,
    9,
    slate
  );

  return pdfDoc.save();
};
