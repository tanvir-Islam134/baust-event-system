import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import eventService from '../../services/eventService.js';
import financeService from '../../services/financeService.js';
import BudgetSummaryWidget from './BudgetSummaryWidget.jsx';

const PRESET_CATEGORIES = [
  'Decorations',
  'Food & Catering',
  'Logistics',
  'Sound & Stage',
  'Printing & Banners',
  'Prizes & Gifts',
  'Marketing',
  'Other',
];

function formatExpenseDate(raw) {
  if (!raw) return 'Just now';
  try {
    const dateObj = raw?._seconds
      ? new Date(raw._seconds * 1000)
      : raw?.seconds
      ? new Date(raw.seconds * 1000)
      : new Date(raw);
    if (isNaN(dateObj.getTime())) return '—';
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function OrganizerBudgetTracker() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Events state
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Real-time financial state
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Add Expense form state
  const [formOpen, setFormOpen] = useState(true);
  const [category, setCategory] = useState('Decorations');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load organizer's events (or all approved events for admin)
  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        const list = isAdmin
          ? await eventService.getApprovedEvents()
          : await eventService.getMyEvents();
        const normalized = Array.isArray(list) ? list : [];
        if (!active) return;
        setEvents(normalized);
        if (normalized.length > 0) {
          setSelectedEventId((prev) => prev || normalized[0].id);
        }
      } catch (err) {
        console.error('Failed to load events for budget tracker:', err);
      } finally {
        if (active) setLoadingEvents(false);
      }
    };
    loadEvents();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const fetchBudgetData = useCallback(
    async (eventId, silent = false) => {
      if (!eventId) return;
      try {
        if (!silent) setLoadingData(true);
        setError(null);
        const [summaryRes, expensesRes] = await Promise.all([
          financeService.getBudgetSummaryByEvent(eventId),
          financeService.getExpensesByEvent(eventId),
        ]);
        setSummary(summaryRes);
        const expItems = expensesRes?.items || (Array.isArray(expensesRes) ? expensesRes : []);
        setExpenses(expItems);
        setLastSyncedAt(new Date());
      } catch (err) {
        if (!silent) {
          setError(err.response?.data?.error?.message || err.message || 'Failed to load budget data');
        }
      } finally {
        if (!silent) setLoadingData(false);
      }
    },
    []
  );

  // Initial load + real-time polling every 15s
  useEffect(() => {
    if (!selectedEventId) return;
    fetchBudgetData(selectedEventId, false);
    const interval = setInterval(() => {
      fetchBudgetData(selectedEventId, true);
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedEventId, fetchBudgetData]);

  // Real-time Socket.io listener when available
  useEffect(() => {
    if (!selectedEventId) return;
    let socket = null;
    let mounted = true;
    import('socket.io-client')
      .then(({ io }) => {
        if (!mounted || !io) return;
        const socketUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !import.meta.env.VITE_SERVER_URL) {
          return;
        }
        socket = io(socketUrl, { withCredentials: true, transports: ['websocket', 'polling'] });
        socket.on('finance_updated', (payload) => {
          if (!payload?.eventId || payload.eventId === selectedEventId) {
            fetchBudgetData(selectedEventId, true);
          }
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
      if (socket) socket.disconnect();
    };
  }, [selectedEventId, fetchBudgetData]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return;

    const finalCategory =
      category === 'Other' && customCategory.trim() ? customCategory.trim() : category;

    if (!finalCategory || Number(amount) <= 0) {
      showToast('Please enter a valid category and positive amount.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await financeService.createExpense({
        eventId: selectedEventId,
        category: finalCategory,
        amount: Number(amount),
        note: note.trim() || null,
        receiptUrl: receiptUrl.trim() || null,
      });

      setAmount('');
      setNote('');
      setReceiptUrl('');
      setCustomCategory('');
      showToast('Expense logged! Budget summary updated.', 'success');
      await fetchBudgetData(selectedEventId, true);
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to log expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      setDeletingId(expenseId);
      await financeService.deleteExpense(expenseId);
      showToast('Expense removed.', 'success');
      await fetchBudgetData(selectedEventId, true);
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to delete expense', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const uniqueCategories = useMemo(() => {
    const set = new Set(expenses.map((e) => e.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return expenses.filter((exp) => {
      const matchesCat = categoryFilter === 'ALL' || exp.category === categoryFilter;
      const matchesSearch =
        !q ||
        (exp.category || '').toLowerCase().includes(q) ||
        (exp.note || '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [expenses, categoryFilter, searchQuery]);

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [filteredExpenses]
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2.5 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="flex-1">{toast.message}</span>
        </div>
      )}

      {/* Header & Event Selector */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-[#14213D]">
              Real-Time Budget & Expense Tracker
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Log itemized event costs (decorations, food, logistics) and compare them against live approved ticket revenue.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="min-w-[240px]">
            {loadingEvents ? (
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ) : events.length === 0 ? (
              <div className="text-xs text-slate-400 italic px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                No events found for your club
              </div>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-[#14213D] bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title || ev.eventName} ({ev.date})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedEventId && (
            <button
              type="button"
              onClick={() => fetchBudgetData(selectedEventId, false)}
              disabled={loadingData}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-[#14213D] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className={loadingData ? 'animate-spin' : ''}>🔄</span>
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {lastSyncedAt && (
        <div className="text-[11px] text-slate-400 text-right -mt-3">
          Last synced: {lastSyncedAt.toLocaleTimeString()}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {selectedEventId && (
        <>
          {/* Financial Summary Widget */}
          <BudgetSummaryWidget summary={summary} loading={loadingData} />

          {/* Log New Expense Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-extrabold text-[#14213D]">Log Event Cost</h3>
                <p className="text-[11px] text-slate-500">
                  Quickly add decorations, catering, logistics, or vendor expenses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen((v) => !v)}
                className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] cursor-pointer"
              >
                {formOpen ? 'Hide Form ▲' : 'Show Form ▼'}
              </button>
            </div>

            {formOpen && (
              <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                {/* Quick Category Chips */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Cost Category *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          category === cat
                            ? 'bg-[#14213D] text-[#FCA311] border-[#14213D] shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#FCA311]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category === 'Other' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Custom Category *
                      </label>
                      <input
                        type="text"
                        required
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="e.g. Guest Honorarium"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Amount (BDT ৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 3500"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                    />
                  </div>

                  <div className={category === 'Other' ? '' : 'lg:col-span-2'}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description / Vendor Note
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Stage flowers & backdrop banner"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Receipt URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={receiptUrl}
                      onChange={(e) => setReceiptUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] font-extrabold rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Logging Expense...' : '+ Log Expense'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Logged Expenses Data Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#14213D]">
                  Logged Event Expenses ({filteredExpenses.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Itemized ledger of all recorded costs for this event.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search category or note..."
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                >
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                No expenses match your filter. Use the form above to log your first event cost.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description / Note</th>
                      <th className="py-3 px-4">Receipt</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatExpenseDate(exp.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-[#14213D]/10 text-[#14213D] font-bold text-[11px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs">
                          {exp.note || <span className="text-slate-400 italic">No description</span>}
                        </td>
                        <td className="py-3 px-4">
                          {exp.receiptUrl ? (
                            <a
                              href={exp.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#14213D] hover:text-[#FCA311] font-bold underline"
                            >
                              View &rarr;
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-rose-600 whitespace-nowrap">
                          ৳ {Number(exp.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={deletingId === exp.id}
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === exp.id ? '...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right text-slate-600">
                        {categoryFilter === 'ALL' && !searchQuery
                          ? 'Total Logged Expenses:'
                          : 'Filtered Subtotal:'}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-700 font-extrabold">
                        ৳ {filteredTotal.toLocaleString()}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
