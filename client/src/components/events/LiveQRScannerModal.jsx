import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import registrationService from '../../services/registrationService.js';

export default function LiveQRScannerModal({ event, onClose, onCheckInComplete }) {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [sessionCount, setSessionCount] = useState(0);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'

  const html5QrCodeRef = useRef(null);
  const isComponentMounted = useRef(true);
  const processingRef = useRef(false);
  const lastScanRef = useRef({ code: null, timestamp: 0 });

  // Synthesize clean audio chimes using Web Audio API
  const playSound = (type = 'success') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'success') {
        // High pleasant ding
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        // Low double-beep alert
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.setValueAtTime(220, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch {
      // Audio not permitted or supported
    }
  };

  // Start Camera
  const startCamera = async (mode = facingMode) => {
    try {
      setCameraError(null);
      const scannerId = 'qr-reader-container';

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerId);
      }

      const qr = html5QrCodeRef.current;
      if (qr.isScanning) {
        await qr.stop();
      }

      await qr.start(
        { facingMode: mode },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // Frame scanned with no QR detected (ignore)
        }
      );

      if (isComponentMounted.current) {
        setScanning(true);
      }
    } catch (err) {
      if (isComponentMounted.current) {
        setScanning(false);
        setCameraError(err.message || 'Camera permission denied or camera unavailable.');
      }
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
    } catch {
      // Silently catch stop errors
    } finally {
      if (isComponentMounted.current) {
        setScanning(false);
      }
    }
  };

  // Toggle Camera Front / Back
  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    await startCamera(nextMode);
  };

  useEffect(() => {
    isComponentMounted.current = true;
    startCamera('environment');

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isComponentMounted.current = false;
      window.removeEventListener('keydown', handleKeyDown);
      stopCamera();
    };
  }, []);

  // Process detected QR code payload with stale-closure & duplicate-scan guard
  const handleDetectedCode = async (codeString) => {
    const trimmed = String(codeString || '').trim();
    if (!trimmed) return;
    const now = Date.now();
    if (
      processingRef.current ||
      (lastScanRef.current.code === trimmed && now - lastScanRef.current.timestamp < 3000)
    ) {
      return;
    }

    processingRef.current = true;
    lastScanRef.current = { code: trimmed, timestamp: now };
    try {
      setProcessing(true);

      const payload = {
        eventId: event?.id,
      };

      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.qrToken) payload.qrToken = parsed.qrToken;
          else if (parsed.ticketCode || parsed.ticketId) {
            payload.ticketCode = parsed.ticketCode || parsed.ticketId;
          }
          if (parsed.eventId && !payload.eventId) payload.eventId = parsed.eventId;
        } catch {
          payload.ticketCode = trimmed;
        }
      } else if (trimmed.startsWith('eyJ') || trimmed.split('.').length === 3) {
        payload.qrToken = trimmed;
      } else {
        payload.ticketCode = trimmed;
      }

      const res = await registrationService.checkInAttendee(payload);

      if (res.alreadyAttended) {
        playSound('warning');
      } else {
        playSound('success');
        setSessionCount((prev) => prev + 1);
        if (onCheckInComplete) {
          onCheckInComplete(res);
        }
      }

      setScanResult(res);
    } catch (err) {
      playSound('warning');
      setScanResult({
        success: false,
        error: true,
        message:
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Check-in failed: Invalid or counterfeit ticket.',
      });
    } finally {
      processingRef.current = false;
      if (isComponentMounted.current) {
        setProcessing(false);
      }
    }
  };

  // Manual code entry submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedCode(manualCode.trim());
    setManualCode('');
  };

  // Distribute food/tshirt voucher on current scan result
  const handleCollectItem = async (itemType) => {
    if (!scanResult?.registration?.id) return;
    try {
      const regId = scanResult.registration.id;
      const updated = await registrationService.distributeItem(regId, itemType);
      setScanResult((prev) => ({
        ...prev,
        registration: updated,
        attendee: {
          ...prev.attendee,
          received: updated.received,
        },
      }));
      playSound('success');
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to update item delivery');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {/* Floating Viewport Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-[70] px-4 py-2 rounded-full bg-slate-900/95 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-2xl border border-white/20 transition cursor-pointer hover:scale-105 active:scale-95"
        title="Close (Esc)"
        aria-label="Close scanner"
      >
        <span className="text-sm leading-none font-bold">✕</span>
        <span>Close Scanner</span>
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
        <div
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#14213D] text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#FCA311]/20 text-[#FCA311] flex items-center justify-center text-xl">
                📷
              </span>
              <div>
                <span className="text-[10px] tracking-widest font-bold uppercase text-[#FCA311] block">
                  Gate Check-in Scanner
                </span>
                <h3 className="text-base font-bold text-white truncate max-w-xs">
                  {event?.title || 'Event Check-in'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Session: {sessionCount}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition cursor-pointer border border-slate-700"
                title="Close (Esc)"
                aria-label="Close scanner"
              >
                ✕
              </button>
            </div>
          </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-slate-900 p-4 flex flex-col items-center justify-center min-h-[300px]">
          {/* HTML5 QR Code Container */}
          <div
            id="qr-reader-container"
            className="w-full max-w-xs rounded-2xl overflow-hidden border-2 border-[#FCA311]/40 shadow-inner bg-black"
          />

          {/* Camera Scanning Reticle Overlay Animation */}
          {scanning && !processing && (
            <div className="absolute inset-x-12 top-10 pointer-events-none flex flex-col items-center">
              <span className="text-[11px] text-[#FCA311] bg-slate-900/80 px-3 py-1 rounded-full font-medium tracking-wide">
                Point camera at attendee QR pass
              </span>
            </div>
          )}

          {/* Camera Controls */}
          <div className="flex items-center gap-3 mt-3 z-10">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
            >
              <span>🔄</span> Flip Camera ({facingMode === 'environment' ? 'Back' : 'Front'})
            </button>
            {!scanning && (
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
              >
                Restart Camera
              </button>
            )}
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-200 rounded-xl text-xs mt-3 text-center max-w-xs">
              ⚠️ {cameraError}
              <p className="mt-1 text-[10px] text-slate-300">
                You can still type the ticket code manually below.
              </p>
            </div>
          )}
        </div>

        {/* Scan Result Card (Feedback) */}
        {scanResult && (
          <div
            className={`p-4 border-b transition-all ${
              scanResult.error || !scanResult.success
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : scanResult.alreadyAttended
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">
                  {scanResult.error || !scanResult.success
                    ? '❌'
                    : scanResult.alreadyAttended
                    ? '⚠️'
                    : '✅'}
                </span>
                <div>
                  <h4 className="font-bold text-sm sm:text-base leading-snug">
                    {scanResult.message}
                  </h4>
                  {scanResult.attendee && (
                    <span className="text-xs font-medium block mt-0.5 opacity-90">
                      {scanResult.attendee.name} • {scanResult.attendee.department || 'BAUST'}
                      {scanResult.attendee.studentId ? ` (ID: ${scanResult.attendee.studentId})` : ''}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setScanResult(null)}
                className="text-xs font-semibold px-2 py-1 rounded bg-white/70 hover:bg-white text-slate-700 shadow-sm transition"
              >
                Clear
              </button>
            </div>

            {/* Quick Item Delivery Buttons */}
            {scanResult.success && scanResult.registration && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                {scanResult.registration.foodType && (
                  <button
                    disabled={scanResult.registration.received?.food?.done}
                    onClick={() => handleCollectItem('food')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      scanResult.registration.received?.food?.done
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                    }`}
                  >
                    <span>🍔</span>
                    {scanResult.registration.received?.food?.done
                      ? 'Food Delivered ✓'
                      : `Deliver Food (${scanResult.registration.foodType})`}
                  </button>
                )}

                {scanResult.registration.tshirtSize && (
                  <button
                    disabled={scanResult.registration.received?.tshirt?.done}
                    onClick={() => handleCollectItem('tshirt')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      scanResult.registration.received?.tshirt?.done
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                    }`}
                  >
                    <span>👕</span>
                    {scanResult.registration.received?.tshirt?.done
                      ? 'T-Shirt Delivered ✓'
                      : `Deliver T-Shirt (${scanResult.registration.tshirtSize})`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Code Input Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <input
              type="text"
              placeholder="Or enter Ticket Code (e.g. TKT-ABC123)..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FCA311] bg-white text-slate-800"
            />
            <button
              type="submit"
              disabled={processing || !manualCode.trim()}
              className="px-4 py-2.5 bg-[#14213D] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
);
}
