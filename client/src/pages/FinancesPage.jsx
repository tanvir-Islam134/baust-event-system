import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import eventService from '../services/eventService.js';
import financeService from '../services/financeService.js';

export default function FinancesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Events state
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Financial data state
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [loadingFinances, setLoadingFinances] = useState(false);
  const [financeError, setFinanceError] = useState(null);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Expense form
  const [expenseForm, setExpenseForm] = useState({
    category: 'Catering',
    amount: '',
    note: '',
    receiptUrl: '',
  });

  // Income form
  const [incomeForm, setIncomeForm] = useState({
    source: '',
    amount: '',
    type: 'sponsor',
  });

  // Load events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const data = await eventService.getApprovedEvents();
        const approvedList = Array.isArray(data) ? data : [];
        setEvents(approvedList);
        if (approvedList.length > 0) {
          setSelectedEventId(approvedList[0].id);
        }
      } catch (err) {
        console.error('Failed to load events for finance management:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  const loadFinances = useCallback(async (eventId) => {
    if (!eventId) return;
    try {
      setLoadingFinances(true);
      setFinanceError(null);

      const [expRes, incRes] = await Promise.all([
        financeService.getExpensesByEvent(eventId),
        financeService.getIncomesByEvent(eventId),
      ]);

      const expList = expRes?.items || (Array.isArray(expRes) ? expRes : []);
      const incList = incRes?.items || (Array.isArray(incRes) ? incRes : []);

      setExpenses(expList);
      setIncomes(incList);
      setTotalExpenses(expRes?.totalAmount !== undefined ? expRes.totalAmount : expList.reduce((acc, i) => acc + Number(i.amount || 0), 0));
      setTotalIncomes(incRes?.totalAmount !== undefined ? incRes.totalAmount : incList.reduce((acc, i) => acc + Number(i.amount || 0), 0));
    } catch (err) {
      setFinanceError(err.response?.data?.error?.message || err.message || 'Failed to load financial records');
    } finally {
      setLoadingFinances(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadFinances(selectedEventId);
    }
  }, [selectedEventId, loadFinances]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setModalError(null);

      await financeService.createExpense({
        eventId: selectedEventId,
        category: expenseForm.category.trim(),
        amount: Number(expenseForm.amount),
        note: expenseForm.note.trim() || null,
        receiptUrl: expenseForm.receiptUrl.trim() || null,
      });

      setIsExpenseModalOpen(false);
      setExpenseForm({ category: 'Catering', amount: '', note: '', receiptUrl: '' });
      showToast('Expense recorded successfully!');
      loadFinances(selectedEventId);
    } catch (err) {
      setModalError(err.response?.data?.error?.message || err.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateIncome = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setModalError(null);

      await financeService.createIncome({
        eventId: selectedEventId,
        source: incomeForm.source.trim(),
        amount: Number(incomeForm.amount),
        type: incomeForm.type,
      });

      setIsIncomeModalOpen(false);
      setIncomeForm({ source: '', amount: '', type: 'sponsor' });
      showToast('Income recorded successfully!');
      loadFinances(selectedEventId);
    } catch (err) {
      setModalError(err.response?.data?.error?.message || err.message || 'Failed to record income');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEvent = events.find((ev) => ev.id === selectedEventId);
  const netBalance = totalIncomes - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-emerald-600 text-white p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1 text-sm font-medium">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header and Event Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Event Financials</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track itemized expenditures, sponsorship revenues, and event budget balances.
          </p>
        </div>

        {/* Event Picker */}
        <div className="min-w-[240px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Select Event
          </label>
          {loadingEvents ? (
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ) : events.length === 0 ? (
            <div className="text-xs text-slate-400 italic">No approved events available</div>
          ) : (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.date})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {selectedEvent && (
        <>
          {/* Financial Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Incomes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Incomes</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                ৳ {Number(totalIncomes).toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{incomes.length} revenue entries</span>
            </div>

            {/* Total Expenses */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                ৳ {Number(totalExpenses).toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{expenses.length} expenditure entries</span>
            </div>

            {/* Net Balance */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Balance</span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  netBalance >= 0 ? 'text-blue-600' : 'text-rose-600'
                }`}
              >
                ৳ {Number(netBalance).toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {netBalance >= 0 ? 'Budget Surplus' : 'Deficit'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-800">Ledger Records</h2>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setModalError(null);
                  setIsExpenseModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Expense</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    setModalError(null);
                    setIsIncomeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Income</span>
                </button>
              )}
            </div>
          </div>

          {loadingFinances ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium text-slate-500">Loading financial statements...</p>
            </div>
          ) : financeError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-800">
              {financeError}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Incomes Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-emerald-50/50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                    <span>💵 Incomes</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      ৳ {Number(totalIncomes).toLocaleString()}
                    </span>
                  </h3>
                </div>

                {incomes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No income or sponsorship recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2.5 px-3.5">Source</th>
                          <th className="py-2.5 px-3.5">Type</th>
                          <th className="py-2.5 px-3.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {incomes.map((inc) => (
                          <tr key={inc.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3.5 font-medium text-slate-800">{inc.source}</td>
                            <td className="py-3 px-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  inc.type === 'sponsor'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {inc.type}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right font-bold text-emerald-700">
                              ৳ {Number(inc.amount).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Expenses Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-rose-50/50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                    <span>🧾 Expenses</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                      ৳ {Number(totalExpenses).toLocaleString()}
                    </span>
                  </h3>
                </div>

                {expenses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No expenses recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2.5 px-3.5">Category</th>
                          <th className="py-2.5 px-3.5">Note</th>
                          <th className="py-2.5 px-3.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3.5 font-medium text-slate-800">{exp.category}</td>
                            <td className="py-3 px-3.5 text-slate-500">
                              <span className="block truncate max-w-[150px]">{exp.note || '-'}</span>
                              {exp.receiptUrl && (
                                <a
                                  href={exp.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-600 hover:underline"
                                >
                                  View Receipt &rarr;
                                </a>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-right font-bold text-rose-700">
                              ৳ {Number(exp.amount).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Record Event Expense</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g. Catering, Venue Decoration, Sound System"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (BDT) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note / Description</label>
                <textarea
                  rows="2"
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Details about items purchased or vendor info..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt URL (Optional)</label>
                <input
                  type="url"
                  value={expenseForm.receiptUrl}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, receiptUrl: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Income Modal */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Record Event Income</h3>
              <button
                onClick={() => setIsIncomeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateIncome} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Name *</label>
                <input
                  type="text"
                  required
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm((prev) => ({ ...prev, source: e.target.value }))}
                  placeholder="e.g. Walton Hi-Tech Industries / 10th Batch Alumni"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (BDT) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="e.g. 25000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Income Type *</label>
                <select
                  value={incomeForm.type}
                  onChange={(e) => setIncomeForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="sponsor">Corporate / Title Sponsor</option>
                  <option value="alumni">Alumni Contribution</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
