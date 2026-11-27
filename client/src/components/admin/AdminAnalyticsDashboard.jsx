import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import adminService from '../../services/adminService.js';

const NAVY = '#14213D';
const GOLD = '#FCA311';
const EMERALD = '#10B981';
const ROSE = '#E11D48';
const SLATE = '#94A3B8';

export default function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(
        err.response?.data?.error?.message || err.message || 'Failed to load university analytics'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !analytics) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <p className="text-sm font-bold text-rose-800">{error}</p>
        <button
          type="button"
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-[#14213D] text-[#FCA311] rounded-xl text-xs font-bold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const clubPerformance = Array.isArray(analytics?.clubPerformance)
    ? analytics.clubPerformance
    : [];
  const monthlyTrend = Array.isArray(analytics?.monthlyTrend) ? analytics.monthlyTrend : [];

  const approvedRegs = Number(summary.approvedRegistrations || 0);
  const checkedInCount = Number(summary.checkedInCount || 0);
  const notCheckedIn = Math.max(0, approvedRegs - checkedInCount);

  const attendancePieData = [
    { name: 'Checked In', value: checkedInCount },
    { name: 'Not Checked In', value: notCheckedIn },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-[#14213D]">
              University-Wide Analytics &amp; Insights
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#14213D] text-[#FCA311]">
              BAUST Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Club-wise event performance, monthly student participation trends, gate attendance rate, and campus financials.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="px-4 py-2 border border-slate-300 hover:border-[#FCA311] bg-white text-[#14213D] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Top KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Campus Events
          </span>
          <p className="text-2xl font-extrabold text-[#14213D] mt-1">
            {summary.totalEvents || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {summary.approvedEvents || 0} approved • {summary.pendingEvents || 0} pending
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Attendance Rate
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {summary.overallAttendanceRate || 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {checkedInCount} checked in / {approvedRegs} approved passes
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Campus Revenue vs Expense
          </span>
          <p className="text-2xl font-extrabold text-[#14213D] mt-1">
            ৳ {Number(summary.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="text-xs text-rose-600 font-semibold mt-1">
            Expenses: ৳ {Number(summary.totalExpenses || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-[#14213D] text-white rounded-2xl border border-[#14213D] p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FCA311]">
            Event Rating Score
          </span>
          <p className="text-2xl font-extrabold mt-1">
            {summary.avgPlatformRating > 0 ? `${summary.avgPlatformRating} / 5.0 ★` : 'No Reviews'}
          </p>
          <p className="text-xs text-slate-300 mt-1">
            {summary.totalFeedbacks || 0} verified attendee reviews
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Club-wise Event Performance */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#14213D]">
              Club-Wise Event Performance
            </h3>
            <p className="text-[11px] text-slate-500">
              Approved registrations vs. actual gate check-ins per campus club.
            </p>
          </div>
          {clubPerformance.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No club performance data yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clubPerformance} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="clubName"
                    tick={{ fontSize: 10, fill: '#475569' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="approvedCount" name="Approved Registered" fill={NAVY} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="checkedInCount" name="Checked In" fill={GOLD} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Monthly Participation Trend */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#14213D]">
              Monthly Participation Trend
            </h3>
            <p className="text-[11px] text-slate-500">
              Total student registrations vs. verified gate attendance by month.
            </p>
          </div>
          {monthlyTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No monthly trend data available yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    name="Total Registrations"
                    stroke={NAVY}
                    fill={NAVY}
                    fillOpacity={0.18}
                  />
                  <Area
                    type="monotone"
                    dataKey="checkedIn"
                    name="Checked In"
                    stroke={EMERALD}
                    fill={EMERALD}
                    fillOpacity={0.25}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 3: Campus-Wide Revenue vs Expense by Club */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#14213D]">
              Campus-Wide Revenue vs. Expense by Club (৳)
            </h3>
            <p className="text-[11px] text-slate-500">
              Ticket + sponsor income compared against logged expenses per club.
            </p>
          </div>
          {clubPerformance.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No financial data recorded yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clubPerformance} margin={{ top: 10, right: 10, left: -5, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="clubName"
                    tick={{ fontSize: 10, fill: '#475569' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip formatter={(v) => `৳ ${Number(v).toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="revenue" name="Total Revenue (৳)" fill={EMERALD} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Total Expenses (৳)" fill={ROSE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 4: Attendance Rate Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#14213D]">
              Overall Attendance Rate (Checked In vs. Registered)
            </h3>
            <p className="text-[11px] text-slate-500">
              Share of approved ticket holders checked in at campus event gates.
            </p>
          </div>
          {approvedRegs === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No approved registrations yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={4}
                    label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                  >
                    <Cell fill={EMERALD} />
                    <Cell fill={SLATE} />
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Club Performance Breakdown Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-[#14213D]">
            Club Performance &amp; Financial Ledger Summary
          </h3>
        </div>
        {clubPerformance.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No club records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Club / Society</th>
                  <th className="py-3 px-4 text-center">Events</th>
                  <th className="py-3 px-4 text-center">Approved</th>
                  <th className="py-3 px-4 text-center">Checked In</th>
                  <th className="py-3 px-4 text-center">Attendance Rate</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Expenses</th>
                  <th className="py-3 px-4 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clubPerformance.map((club) => (
                  <tr key={club.clubName} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-[#14213D]">{club.clubName}</td>
                    <td className="py-3 px-4 text-center font-semibold">{club.eventsCount}</td>
                    <td className="py-3 px-4 text-center font-semibold">{club.approvedCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">
                      {club.checkedInCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[#14213D]">
                        {club.attendanceRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      ৳ {Number(club.revenue || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      ৳ {Number(club.expenses || 0).toLocaleString()}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-extrabold ${
                        club.netBalance >= 0 ? 'text-[#14213D]' : 'text-rose-700'
                      }`}
                    >
                      ৳ {Number(club.netBalance || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
