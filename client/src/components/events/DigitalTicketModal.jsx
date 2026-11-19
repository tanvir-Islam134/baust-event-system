import React, { useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function DigitalTicketModal({ ticketData, onClose }) {
  const printRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!ticketData) return null;

  const { registration, event, attendee } = ticketData;
  const qrValue = registration.qrToken || registration.ticketCode;

  // Trigger browser print for saving as PDF or physical print
  const handlePrint = () => {
    window.print();
  };

  // Download QR code SVG directly as an image file
  const handleDownloadQR = () => {
    const svg = document.getElementById('ticket-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `BAUST_Ticket_${registration.ticketCode || 'Pass'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const formattedDate = (() => {
    if (!event?.date) return 'TBD';
    try {
      const d = new Date(event.date);
      if (isNaN(d.getTime())) return event.date;
      if (d.getFullYear() > 2100 || d.getFullYear() < 2000) {
        return event.date;
      }
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return event.date || 'TBD';
    }
  })();

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 print:p-0 print:bg-white"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {/* Floating Viewport Close Button (always visible on screen) */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-[70] px-4 py-2 rounded-full bg-slate-900/95 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-2xl border border-white/20 transition cursor-pointer print:hidden hover:scale-105 active:scale-95"
        title="Close (Esc)"
        aria-label="Close pass"
      >
        <span className="text-sm leading-none font-bold">✕</span>
        <span>Close Pass</span>
      </button>

      {/* Centering wrapper that allows full vertical scroll without cutting off the top */}
      <div
        className="min-h-full flex items-center justify-center py-6 sm:py-10"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        {/* Modal Container */}
        <div
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 print:border-none print:shadow-none print:m-0 print:max-w-none animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top-Right Header Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold transition shadow-sm border border-white/30 cursor-pointer print:hidden"
            aria-label="Close ticket"
            title="Close pass (Esc)"
          >
            ✕
          </button>

        {/* Printable Ticket Area */}
        <div ref={printRef} className="print:w-full">
          {/* Ticket Header Banner */}
          <div className="bg-gradient-to-r from-[#14213D] via-[#1E293B] to-[#14213D] text-white p-6 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-[#FCA311]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-3">
              <img src="/baust-logo.png" alt="BAUST" className="w-10 h-10 object-contain drop-shadow" />
              <div>
                <span className="text-[10px] tracking-widest font-bold uppercase text-[#FCA311] block">
                  BAUST Event System
                </span>
                <span className="text-xs text-slate-300 font-medium">Saidpur Cantonment, Nilphamari</span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 mt-2">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FCA311]/20 text-[#FCA311] border border-[#FCA311]/30 mb-1.5">
                  {event?.category || 'Campus Event'}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  {event?.title || 'University Event'}
                </h2>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  VERIFIED PASS
                </span>
              </div>
            </div>

            {/* Quick Event Metadata */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-700/60 text-xs text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Date & Time</span>
                <span className="font-medium text-white">{formattedDate}</span>
                {event?.time && <span className="block text-[11px] text-slate-300">{event.time}</span>}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Venue</span>
                <span className="font-medium text-white truncate block">{event?.venue || 'Campus Auditorium'}</span>
                {event?.clubName && (
                  <span className="text-[11px] text-[#FCA311] truncate block">{event.clubName}</span>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Body / Perforated Divider */}
          <div className="relative bg-white p-6 pt-8">
            {/* Notch Cutouts */}
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-slate-900/80 rounded-full print:hidden" />
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-900/80 rounded-full print:hidden" />
            <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-slate-200" />

            {/* Attendee Details Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Attendee</span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base truncate block">
                    {attendee?.name || 'Student Attendee'}
                  </span>
                  <span className="text-xs text-slate-500 truncate block">{attendee?.email}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Pass ID</span>
                  <span className="font-mono font-bold text-xs text-[#14213D] px-2 py-0.5 rounded bg-slate-200 inline-block">
                    {registration.ticketCode || 'TKT-LIVE'}
                  </span>
                </div>
              </div>

              {/* Cohort Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {attendee?.studentId && (
                  <div>
                    <span className="text-[10px] text-slate-400 block">Student ID</span>
                    <span className="font-semibold text-slate-700">{attendee.studentId}</span>
                  </div>
                )}
                {attendee?.department && (
                  <div>
                    <span className="text-[10px] text-slate-400 block">Department</span>
                    <span className="font-semibold text-slate-700">{attendee.department}</span>
                  </div>
                )}
                {(attendee?.batch || attendee?.section) && (
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cohort</span>
                    <span className="font-semibold text-slate-700">
                      {attendee.batch ? `${attendee.batch} ` : ''}
                      {attendee.section ? `Sec ${attendee.section}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Centerpiece */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 inline-block mb-2">
                <QRCodeSVG
                  id="ticket-qr-code"
                  value={qrValue}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <span className="text-[11px] font-mono text-slate-500 tracking-wider">
                {registration.ticketCode}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Show this digital QR code at the event gate to check in.
              </p>
            </div>

            {/* Vouchers & Perks (Food & T-Shirt) */}
            {(registration.foodType || registration.tshirtSize || registration.received) && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-around text-xs">
                {registration.foodType && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>🍔</span>
                    <div>
                      <span className="font-semibold block text-[11px]">Food Voucher</span>
                      <span className="text-[10px] text-slate-500 capitalize">{registration.foodType}</span>
                      {registration.received?.food?.done && (
                        <span className="text-[9px] text-emerald-600 font-bold block">✓ Collected</span>
                      )}
                    </div>
                  </div>
                )}

                {registration.tshirtSize && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>👕</span>
                    <div>
                      <span className="font-semibold block text-[11px]">T-Shirt Voucher</span>
                      <span className="text-[10px] text-slate-500 uppercase">Size: {registration.tshirtSize}</span>
                      {registration.received?.tshirt?.done && (
                        <span className="text-[9px] text-emerald-600 font-bold block">✓ Collected</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Attendance Status */}
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span>🎟️</span>
                  <div>
                    <span className="font-semibold block text-[11px]">Status</span>
                    {registration.attended ? (
                      <span className="text-[10px] font-bold text-emerald-600 block">✓ Attended</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 block">Not Checked In</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons (Hidden in print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>✕</span> Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>📥</span> Download QR
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-[#1E293B] rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>🖨️</span> Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
