import React from 'react';

/**
 * Financial Summary Widget comparing total ticket revenue (from approved registrations)
 * against total logged event expenses, with utilization bar and category breakdown.
 */
export default function BudgetSummaryWidget({ summary, loading = false }) {
  if (loading && !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  const ticketRevenue = Number(summary?.ticketRevenue || 0);
  const approvedCount = Number(summary?.approvedCount || 0);
  const ticketPrice = Number(summary?.ticketPrice || 0);
  const totalExpenses = Number(summary?.totalExpenses || 0);
  const expenseCount = Number(summary?.expenseCount || 0);
  const totalOtherIncomes = Number(summary?.totalOtherIncomes || 0);
  const netTicketBalance = ticketRevenue - totalExpenses;
  const categoryBreakdown = Array.isArray(summary?.categoryBreakdown) ? summary.categoryBreakdown : [];

  const utilizationPct =
    ticketRevenue > 0
      ? Math.min(100, Math.round((totalExpenses / ticketRevenue) * 100))
      : totalExpenses > 0
      ? 100
      : 0;

  const isDeficit = netTicketBalance < 0;
  const isWarning = !isDeficit && utilizationPct >= 75;

  return (
    <div className="space-y-4">
      {/* Top 3 Financial Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Ticket Revenue (Approved Registrations) */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ticket Revenue
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {approvedCount} Approved
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            ৳ {ticketRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            {approvedCount} approved × ৳{ticketPrice.toLocaleString()} / ticket
          </p>
          {totalOtherIncomes > 0 && (
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              + ৳{totalOtherIncomes.toLocaleString()} sponsor/alumni funds
            </p>
          )}
        </div>

        {/* Card 2: Total Logged Expenses */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Logged Expenses
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {expenseCount} {expenseCount === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">
            ৳ {totalExpenses.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            {ticketRevenue > 0
              ? `${Math.round((totalExpenses / ticketRevenue) * 100)}% of ticket revenue spent`
              : totalExpenses > 0
              ? 'No ticket revenue recorded yet'
              : 'No expenses logged yet'}
          </p>
        </div>

        {/* Card 3: Net Budget Balance */}
        <div
          className={`rounded-2xl shadow-xs border p-5 relative overflow-hidden ${
            isDeficit
              ? 'bg-rose-50/60 border-rose-200'
              : 'bg-[#14213D] border-[#14213D] text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isDeficit ? 'text-rose-700' : 'text-[#FCA311]'
              }`}
            >
              Net Balance (Ticket vs Expense)
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                isDeficit
                  ? 'bg-rose-200 text-rose-900'
                  : 'bg-[#FCA311] text-[#14213D]'
              }`}
            >
              {isDeficit ? 'Deficit' : 'Surplus'}
            </span>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-extrabold mt-2 ${
              isDeficit ? 'text-rose-700' : 'text-white'
            }`}
          >
            {netTicketBalance < 0 ? '-' : ''}৳ {Math.abs(netTicketBalance).toLocaleString()}
          </p>
          <p className={`text-xs mt-1.5 font-medium ${isDeficit ? 'text-rose-700/80' : 'text-slate-300'}`}>
            {isDeficit
              ? 'Logged expenses exceed approved ticket revenue'
              : 'Remaining margin from ticket sales'}
          </p>
        </div>
      </div>

      {/* Expense vs Revenue Utilization Bar & Category Breakdown */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#14213D]">
            Budget Utilization (Expenses vs. Approved Ticket Revenue)
          </span>
          <span
            className={`font-bold ${
              isDeficit ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            ৳{totalExpenses.toLocaleString()} / ৳{ticketRevenue.toLocaleString()} ({utilizationPct}%)
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isDeficit ? 'bg-rose-600' : isWarning ? 'bg-[#FCA311]' : 'bg-emerald-500'
            }`}
            style={{ width: `${utilizationPct}%` }}
          />
        </div>

        {categoryBreakdown.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-2">
            {categoryBreakdown.map((cat) => (
              <span
                key={cat.category}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700"
              >
                <span className="w-2 h-2 rounded-full bg-[#FCA311]" />
                <span>{cat.category}:</span>
                <span className="text-[#14213D] font-bold">৳{Number(cat.amount).toLocaleString()}</span>
                <span className="text-slate-400">({cat.percentage}%)</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
