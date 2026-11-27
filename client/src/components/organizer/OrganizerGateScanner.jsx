import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../contexts/AuthContext.jsx';
import eventService from '../../services/eventService.js';
import registrationService from '../../services/registrationService.js';

/**
 * Extract qrToken / ticketCode from scanned QR payload (supports JWT, JSON, or raw Ticket ID).
 */
function parseQrPayload(rawText) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return {};

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        qrToken: parsed.qrToken || undefined,
        ticketCode: parsed.ticketCode || parsed.ticketId || undefined,
        eventId: parsed.eventId || undefined,
      };
    } catch {
      // Fall through to raw check
    }
  }

  if (trimmed.startsWith('eyJ') || trimmed.split('.').length === 3) {
    return { qrToken: trimmed };
  }

  return { ticketCode: trimmed };
}

export default function OrganizerGateScanner({ onNotify }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Owned events selector
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Camera & scanner state
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [processing, setProcessing] = useState(false);

  // Manual Ticket ID fallback
  const [manualTicketId, setManualTicketId] = useState('');

  // Scan results & audit log
  const [lastResult, setLastResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  // Ref guards to avoid stale closures and duplicate rapid scans inside Html5Qrcode callbacks
  const html5QrRef = useRef(null);
  const mountedRef = useRef(true);
  const processingRef = useRef(false);
  const lastScanRef = useRef({ code: null, timestamp: 0 });
  const selectedEventRef = useRef(selectedEventId);

  useEffect(() => {
    selectedEventRef.current = selectedEventId;
  }, [selectedEventId]);

  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        const list = isAdmin
          ? await eventService.getApprovedEvents()
          : await eventService.getMyEvents();
        if (active) {
          setEvents(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.warn('Failed to load events for gate scanner:', err);
      } finally {
        if (active) setLoadingEvents(false);
      }
    };
    loadEvents();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const stopCamera = async () => {
    try {
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        await html5QrRef.current.stop();
      }
    } catch {
      // Ignore cleanup errors
    } finally {
      if (mountedRef.current) setScanning(false);
    }
  };

  const verifyAndCheckIn = async (rawCode) => {
    const trimmed = String(rawCode || '').trim();
    if (!trimmed) return;

    // Duplicate rapid-scan guard (3s cooldown for identical payload)
    const now = Date.now();
    if (
      processingRef.current ||
      (lastScanRef.current.code === trimmed && now - lastScanRef.current.timestamp < 3000)
    ) {
      return;
    }

    processingRef.current = true;
    lastScanRef.current = { code: trimmed, timestamp: now };
    setProcessing(true);

    try {
      const parsed = parseQrPayload(trimmed);
      const payload = {
        ...parsed,
        ...(selectedEventRef.current && selectedEventRef.current !== 'ALL'
          ? { eventId: selectedEventRef.current }
          : {}),
      };

      const res = await registrationService.checkInAttendee(payload);

      const entry = {
        id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
        status: res.alreadyAttended ? 'duplicate' : 'success',
        message: res.message,
        attendeeName: res.attendee?.name || 'Attendee',
        studentId: res.attendee?.studentId || null,
        eventTitle: res.event?.title || 'Event',
        ticketCode: res.registration?.ticketCode || parsed.ticketCode || 'QR-PASS',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      if (mountedRef.current) {
        setLastResult({
          type: res.alreadyAttended ? 'warning' : 'success',
          ...res,
        });
        setScanHistory((prev) => [entry, ...prev].slice(0, 15));
      }

      if (onNotify) {
        onNotify(res.message, res.alreadyAttended ? 'error' : 'success');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Ticket verification failed';

      if (mountedRef.current) {
        setLastResult({
          type: 'error',
          success: false,
          message: errorMsg,
        });
        setScanHistory((prev) => [
          {
            id: `${now}-err`,
            status: 'error',
            message: errorMsg,
            attendeeName: 'Verification Failed',
            ticketCode: trimmed.slice(0, 20),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          ...prev,
        ].slice(0, 15));
      }

      if (onNotify) {
        onNotify(errorMsg, 'error');
      }
    } finally {
      processingRef.current = false;
      if (mountedRef.current) setProcessing(false);
    }
  };

  const startCamera = async (mode = facingMode) => {
    try {
      setCameraError(null);
      const containerId = 'organizer-gate-qr-reader';
      if (!html5QrRef.current) {
        html5QrRef.current = new Html5Qrcode(containerId);
      }
      if (html5QrRef.current.isScanning) {
        await html5QrRef.current.stop();
      }

      await html5QrRef.current.start(
        { facingMode: mode },
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          verifyAndCheckIn(decodedText);
        },
        () => {}
      );

      if (mountedRef.current) setScanning(true);
    } catch (err) {
      if (mountedRef.current) {
        setScanning(false);
        setCameraError(
          err?.message ||
            'Unable to access camera. Please allow camera permission or use Manual Ticket ID entry below.'
        );
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  const handleToggleFacing = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (scanning) {
      await startCamera(next);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualTicketId.trim()) return;
    await verifyAndCheckIn(manualTicketId.trim());
    setManualTicketId('');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Event Filter */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-[#14213D]">Gate Entry QR Scanner</h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                scanning
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  scanning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {scanning ? 'Camera Active' : 'Camera Idle'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scan student digital pass QR codes or enter Ticket IDs manually to verify approved registrations and check in attendees atomically.
          </p>
        </div>

        <div className="min-w-[240px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Event Scope
          </label>
          {loadingEvents ? (
            <div className="h-9 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-[#14213D] bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
            >
              <option value="ALL">All My Managed Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title || ev.eventName} ({ev.date})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Scanner & Feedback Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camera Scanner + Manual Ticket ID Entry */}
        <div className="lg:col-span-6 bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#14213D]">Camera Scanner</h3>
            <div className="flex items-center gap-2">
              {!scanning ? (
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-3.5 py-1.5 bg-[#14213D] hover:bg-black text-[#FCA311] rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleToggleFacing}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-[#14213D] rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Flip Camera
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>

          {/* QR Reader Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 min-h-[280px] flex items-center justify-center">
            <div id="organizer-gate-qr-reader" className="w-full" />

            {!scanning && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900/90 text-white">
                <div className="w-12 h-12 rounded-2xl bg-[#FCA311]/20 text-[#FCA311] flex items-center justify-center text-2xl mb-3">
                  📷
                </div>
                <p className="text-sm font-bold">Camera Ready</p>
                <p className="text-xs text-slate-300 mt-1 max-w-xs">
                  Click &ldquo;Start Camera&rdquo; to begin scanning student entry QR passes, or enter a Ticket ID manually below.
                </p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-rose-950/90 text-white">
                <p className="text-sm font-bold text-rose-200">Camera Unavailable</p>
                <p className="text-xs text-rose-100/90 mt-1 max-w-xs">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="mt-3 px-4 py-1.5 bg-[#FCA311] text-[#14213D] rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Retry Permission
                </button>
              </div>
            )}

            {processing && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#14213D]/90 text-[#FCA311] text-xs font-bold shadow-lg border border-[#FCA311]/40">
                Verifying ticket...
              </div>
            )}
          </div>

          {/* Manual Ticket ID Fallback */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-[#14213D]">
              Manual Ticket ID Fallback
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualTicketId}
                onChange={(e) => setManualTicketId(e.target.value)}
                placeholder="Enter Ticket ID (e.g. TKT-A1B2C3D4E5F6)"
                className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
              />
              <button
                type="submit"
                disabled={processing || !manualTicketId.trim()}
                className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] font-extrabold rounded-xl text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {processing ? 'Checking...' : 'Verify & Check In'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Real-Time Verification Feedback & Recent Scans */}
        <div className="lg:col-span-6 space-y-6">
          {/* Current Scan Feedback Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6">
            <h3 className="text-sm font-extrabold text-[#14213D] mb-3">Latest Scan Feedback</h3>

            {!lastResult ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                Scan a QR pass or verify a Ticket ID to see student details and check-in confirmation here.
              </div>
            ) : (
              <div
                className={`p-5 rounded-xl border space-y-3 ${
                  lastResult.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200'
                    : lastResult.type === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      lastResult.type === 'success'
                        ? 'bg-emerald-600 text-white'
                        : lastResult.type === 'warning'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {lastResult.type === 'success'
                      ? 'Checked In'
                      : lastResult.type === 'warning'
                      ? 'Already Checked In'
                      : 'Entry Denied'}
                  </span>
                  {lastResult.registration?.ticketCode && (
                    <span className="font-mono text-xs font-bold text-[#14213D]">
                      {lastResult.registration.ticketCode}
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-[#14213D]">{lastResult.message}</p>

                {lastResult.attendee && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/10 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Student</span>
                      <span className="font-bold text-[#14213D]">{lastResult.attendee.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Student ID</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {lastResult.attendee.studentId || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Department</span>
                      <span className="font-medium text-slate-700">
                        {lastResult.attendee.department || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Event</span>
                      <span className="font-semibold text-[#14213D]">
                        {lastResult.event?.title || 'Campus Event'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Session Check-In History */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#14213D]">
                Recent Session Scans ({scanHistory.length})
              </h3>
            </div>

            {scanHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No scans recorded in this session yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
                {scanHistory.map((item) => (
                  <div key={item.id} className="px-6 py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-[#14213D] truncate">{item.attendeeName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.ticketCode} {item.eventTitle ? `• ${item.eventTitle}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'duplicate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status === 'success'
                          ? 'Checked In'
                          : item.status === 'duplicate'
                          ? 'Duplicate'
                          : 'Denied'}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
