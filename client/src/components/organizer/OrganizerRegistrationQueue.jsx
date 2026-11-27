import React, { useState, useMemo, useRef } from 'react';
import registrationService from '../../services/registrationService.js';

/**
 * Responsive Registration Queue table for the Organizer Dashboard.
 * Displays pending student registrations for events owned by the authenticated Organizer
 * with explicit columns: Student Name, Student ID, Department, Level, Term, Event Name, bKash TrxID.
 * Enforces duplicate-action prevention and triggers automatic table updates after Approve/Reject.
 */
export default function OrganizerRegistrationQueue({
  registrations = [],
  loading = false,
  onRefresh,
  onNotify,
  onStatusUpdated,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState(null);
  const [rejectingReg, setRejectingReg] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processedIds, setProcessedIds] = useState(() => new Set());
  const inFlightRef = useRef(new Set());

  const visibleRegistrations = useMemo(
    () => registrations.filter((reg) => !processedIds.has(reg.id)),
    [registrations, processedIds]
  );

  const eventOptions = useMemo(() => {
    const names = new Set(
      visibleRegistrations.map((r) => r.eventName || r.eventTitle).filter(Boolean)
    );
    return ['ALL', ...Array.from(names)];
  }, [visibleRegistrations]);

  const filteredRegistrations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleRegistrations.filter((reg) => {
      const evName = reg.eventName || reg.eventTitle || '';
      const matchesEvent = eventFilter === 'ALL' || evName === eventFilter;
      if (!matchesEvent) return false;
      if (!q) return true;

      const haystack = [
        reg.studentName || reg.participantName,
        reg.studentId,
        reg.department,
        evName,
        reg.trxId,
        reg.participantEmail,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [visibleRegistrations, eventFilter, searchQuery]);

  const handleApprove = async (reg) => {
    if (!reg?.id || inFlightRef.current.has(reg.id)) return;
    inFlightRef.current.add(reg.id);
    setProcessingId(reg.id);

    try {
      await registrationService.approveRegistration(reg.id);
      setProcessedIds((prev) => new Set(prev).add(reg.id));
      if (onNotify) {
        onNotify(
          `Approved registration for ${reg.studentName || reg.participantName || 'student'}.`,
          'success'
        );
      }
      if (onStatusUpdated) onStatusUpdated(reg.id, 'approved');
      if (onRefresh) await onRefresh();
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to approve registration';
      if (onNotify) onNotify(msg, 'error');
    } finally {
      inFlightRef.current.delete(reg.id);
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingReg?.id || inFlightRef.current.has(rejectingReg.id)) return;
    inFlightRef.current.add(rejectingReg.id);
    setProcessingId(rejectingReg.id);

    try {
      const trimmedReason = rejectReason.trim() || null;
      await registrationService.rejectRegistration(rejectingReg.id, trimmedReason);
      setProcessedIds((prev) => new Set(prev).add(rejectingReg.id));
      if (onNotify) {
        onNotify(
          `Rejected registration for ${rejectingReg.studentName || rejectingReg.participantName || 'student'}.`,
          'success'
        );
      }
      if (onStatusUpdated) onStatusUpdated(rejectingReg.id, 'rejected');
      setRejectingReg(null);
      setRejectReason('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to reject registration';
      if (onNotify) onNotify(msg, 'error');
    } finally {
      if (rejectingReg?.id) inFlightRef.current.delete(rejectingReg.id);
      setProcessingId(null);
    }
  };

  return (
    <div id="pending-registrations" className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] overflow-hidden">
      {/* Header & Controls */}
      <div className="p-6 border-b border-[#E5E5E5] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-[#E5E5E5]/30">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#14213D]">Registration Queue</h2>
            <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-[#FCA311] text-[#14213D]">
              {visibleRegistrations.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review, verify bKash TrxID, and approve or reject student registrations for events you own.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, ID, dept, TrxID..."
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] min-w-[200px]"
          />

          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-medium text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
          >
            {eventOptions.map((ev) => (
              <option key={ev} value={ev}>
                {ev === 'ALL' ? 'All Owned Events' : ev}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setProcessedIds(new Set());
              if (onRefresh) onRefresh();
            }}
            disabled={loading}
            className="px-3.5 py-1.5 border border-[#E5E5E5] bg-white hover:border-[#FCA311] rounded-xl text-xs font-bold text-[#14213D] transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table Body */}
      {loading && visibleRegistrations.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-3 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
          <span>Loading pending student registrations...</span>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FCA311]/15 text-[#FCA311] flex items-center justify-center mx-auto mb-3 text-xl">
            🎉
          </div>
          <p className="text-sm font-bold text-[#14213D]">No Pending Registrations</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {visibleRegistrations.length === 0
              ? 'All student registrations for your events have been reviewed.'
              : 'No pending registrations match your current search or event filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-[#E5E5E5] text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Term</th>
                <th className="py-3 px-4">Event Name</th>
                <th className="py-3 px-4">bKash TrxID</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-xs text-slate-700">
              {filteredRegistrations.map((reg) => {
                const isProcessing = processingId === reg.id;
                const studentName = reg.studentName || reg.participantName || 'Unknown Student';
                const eventName = reg.eventName || reg.eventTitle || 'Unknown Event';

                return (
                  <tr key={reg.id} className="hover:bg-slate-50/70 transition">
                    {/* Student Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/30 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {reg.participantPhotoURL ? (
                            <img
                              src={reg.participantPhotoURL}
                              alt={studentName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            studentName.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-[#14213D] block truncate max-w-[180px]">
                            {studentName}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                            {reg.participantEmail || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Student ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#14213D] whitespace-nowrap">
                      {reg.studentId || <span className="text-slate-400 font-sans">—</span>}
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 block max-w-[160px] truncate">
                        {reg.department || <span className="text-slate-400">—</span>}
                      </span>
                    </td>

                    {/* Level */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-700">
                      {reg.level ? `Level ${reg.level}` : <span className="text-slate-400">—</span>}
                    </td>

                    {/* Term */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-700">
                      {reg.term ? `Term ${reg.term}` : <span className="text-slate-400">—</span>}
                    </td>

                    {/* Event Name */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#14213D] block truncate max-w-[200px]">
                        {eventName}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {reg.eventDate || 'Date TBA'} •{' '}
                        {Number(reg.eventFee) > 0 ? `৳${reg.eventFee}` : 'Free'}
                      </span>
                    </td>

                    {/* bKash TrxID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {reg.trxId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E2136E]/10 text-[#E2136E] border border-[#E2136E]/20 font-mono font-bold text-[11px]">
                          {reg.trxId}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase">
                          {reg.paymentMethod || 'Cash'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(reg)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          {isProcessing ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => {
                            setRejectingReg(reg);
                            setRejectReason('');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectingReg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4"
          >
            <div>
              <h3 className="text-base font-extrabold text-[#14213D]">Reject Registration</h3>
              <p className="text-xs text-slate-500 mt-1">
                Rejecting{' '}
                <span className="font-bold text-[#14213D]">
                  {rejectingReg.studentName || rejectingReg.participantName}
                </span>{' '}
                for{' '}
                <span className="font-bold text-[#14213D]">
                  {rejectingReg.eventName || rejectingReg.eventTitle}
                </span>
                . This will free up their reserved seat.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason (Optional)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid or unverified bKash TrxID..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={processingId === rejectingReg.id}
                onClick={() => setRejectingReg(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processingId === rejectingReg.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {processingId === rejectingReg.id ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
