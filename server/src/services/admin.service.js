import { userRepository } from '../repositories/user.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { registrationRepository } from '../repositories/registration.repository.js';
import { expenseRepository } from '../repositories/expense.repository.js';
import { incomeRepository } from '../repositories/income.repository.js';
import { feedbackRepository } from '../repositories/feedback.repository.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Admin Service handling administrative directory queries and organizer lifecycle management.
 */

/**
 * Fetch all approved organizers, sorted by their assigned Club/Society.
 * Ensures Name, Email, Student ID, Department, and assigned clubName/clubId are included.
 */
export const getApprovedOrganizers = async () => {
  const users = await userRepository.findApprovedOrganizers();

  const organizers = users.map((u) => {
    const clubAssigned = u.clubAffiliation || u.clubName || u.clubId || 'Unassigned';
    return {
      id: u.id,
      name: u.name || 'Unnamed Organizer',
      email: u.email,
      studentId: u.studentId || null,
      department: u.department || null,
      batch: u.batch || null,
      section: u.section || null,
      level: u.level || null,
      term: u.term || null,
      mobileNumber: u.mobileNumber || null,
      clubAffiliation: clubAssigned,
      clubName: clubAssigned,
      clubId: u.clubId || clubAssigned,
      role: u.role || 'organizer',
      organizerRequestStatus: u.organizerRequestStatus || 'approved',
      organizerStatus: u.organizerStatus || 'approved',
      createdAt: u.createdAt || null,
      updatedAt: u.updatedAt || null,
    };
  });

  // Sort by clubName / clubAffiliation ascending, then by name
  organizers.sort((a, b) => {
    const clubCompare = (a.clubName || '').localeCompare(b.clubName || '');
    if (clubCompare !== 0) return clubCompare;
    return (a.name || '').localeCompare(b.name || '');
  });

  return organizers;
};

/**
 * Demote or remove an organizer back to participant/student role.
 * Clears their club affiliation and resets request status.
 * @param {string} targetUserId - Target Firebase UID
 */
export const demoteOrganizer = async (targetUserId) => {
  const user = await userRepository.findById(targetUserId);
  if (!user) {
    throw new AppError(`User with ID '${targetUserId}' not found`, 404);
  }

  const updated = await userRepository.update(targetUserId, {
    role: 'participant',
    organizerRequestStatus: 'none',
    organizerStatus: 'none',
    clubAffiliation: null,
  });

  return updated;
};

/**
 * Aggregate university-wide analytics across clubs, months, attendance rates, and financials.
 */
export const getUniversityAnalytics = async () => {
  const [events, registrations, expenses, incomes, feedbacks] = await Promise.all([
    eventRepository.findAll().catch(() => []),
    registrationRepository.findAll().catch(() => []),
    expenseRepository.findAll().catch(() => []),
    incomeRepository.findAll().catch(() => []),
    feedbackRepository.findAll().catch(() => []),
  ]);

  const eventMap = new Map(events.map((ev) => [ev.id, ev]));

  const totalEvents = events.length;
  const approvedEvents = events.filter((e) => e.status === 'approved').length;
  const pendingEvents = events.filter((e) => e.status === 'pending').length;
  const completedEvents = events.filter((e) => e.status === 'completed').length;

  const approvedRegs = registrations.filter((r) => r.status === 'approved');
  const checkedInRegs = approvedRegs.filter((r) => Boolean(r.attended));
  const overallAttendanceRate =
    approvedRegs.length > 0 ? Math.round((checkedInRegs.length / approvedRegs.length) * 100) : 0;

  let totalTicketRevenue = 0;
  const clubMap = new Map();
  const ensureClub = (name) => {
    const key = (name || 'Central BAUST').trim();
    if (!clubMap.has(key)) {
      clubMap.set(key, {
        clubName: key,
        eventsCount: 0,
        registrationsCount: 0,
        approvedCount: 0,
        checkedInCount: 0,
        attendanceRate: 0,
        ticketRevenue: 0,
        otherIncome: 0,
        revenue: 0,
        expenses: 0,
        netBalance: 0,
      });
    }
    return clubMap.get(key);
  };

  const eventPerfMap = new Map();
  for (const ev of events) {
    const clubName = ev.clubName || ev.clubAffiliation || ev.clubId || 'Central BAUST';
    const club = ensureClub(clubName);
    club.eventsCount += 1;

    eventPerfMap.set(ev.id, {
      eventId: ev.id,
      eventTitle: ev.title || ev.eventName || 'Event',
      clubName,
      date: ev.date || '',
      registered: 0,
      approved: 0,
      checkedIn: 0,
      attendanceRate: 0,
      revenue: 0,
      expenses: 0,
    });
  }

  const monthMap = new Map();
  const getMonthBucket = (rawDate) => {
    let ym = '';
    if (typeof rawDate === 'string' && /^\d{4}-\d{2}/.test(rawDate.trim())) {
      ym = rawDate.trim().slice(0, 7);
    } else if (rawDate) {
      const d = rawDate?.toDate
        ? rawDate.toDate()
        : typeof rawDate?._seconds === 'number'
        ? new Date(rawDate._seconds * 1000)
        : new Date(rawDate);
      if (!isNaN(d.getTime())) {
        ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    }
    if (!ym) ym = 'Unknown';
    if (!monthMap.has(ym)) {
      let label = ym;
      if (/^\d{4}-\d{2}$/.test(ym)) {
        const [y, m] = ym.split('-');
        const dt = new Date(Number(y), Number(m) - 1, 1);
        label = dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
      monthMap.set(ym, {
        month: ym,
        label,
        registrations: 0,
        approved: 0,
        checkedIn: 0,
        revenue: 0,
      });
    }
    return monthMap.get(ym);
  };

  for (const reg of registrations) {
    const ev = eventMap.get(reg.eventId);
    const clubName = ev?.clubName || ev?.clubAffiliation || ev?.clubId || reg.clubId || 'Central BAUST';
    const club = ensureClub(clubName);
    club.registrationsCount += 1;

    const evPerf = eventPerfMap.get(reg.eventId);
    if (evPerf) evPerf.registered += 1;

    const bucket = getMonthBucket(ev?.date || reg.createdAt);
    bucket.registrations += 1;

    if (reg.status === 'approved') {
      const price = Number(ev?.ticketPrice ?? ev?.fee ?? 0) || 0;
      totalTicketRevenue += price;
      club.approvedCount += 1;
      club.ticketRevenue += price;
      bucket.approved += 1;
      bucket.revenue += price;
      if (evPerf) {
        evPerf.approved += 1;
        evPerf.revenue += price;
      }

      if (reg.attended) {
        club.checkedInCount += 1;
        bucket.checkedIn += 1;
        if (evPerf) evPerf.checkedIn += 1;
      }
    }
  }

  let totalOtherIncomes = 0;
  for (const inc of incomes) {
    const amt = Number(inc.amount) || 0;
    totalOtherIncomes += amt;
    const ev = eventMap.get(inc.eventId);
    const clubName = ev?.clubName || ev?.clubAffiliation || ev?.clubId || 'Central BAUST';
    const club = ensureClub(clubName);
    club.otherIncome += amt;
  }

  let totalExpenses = 0;
  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0;
    totalExpenses += amt;
    const ev = eventMap.get(exp.eventId);
    const clubName = ev?.clubName || ev?.clubAffiliation || ev?.clubId || 'Central BAUST';
    const club = ensureClub(clubName);
    club.expenses += amt;
    const evPerf = eventPerfMap.get(exp.eventId);
    if (evPerf) evPerf.expenses += amt;
  }

  const clubPerformance = Array.from(clubMap.values())
    .map((c) => ({
      ...c,
      revenue: c.ticketRevenue + c.otherIncome,
      netBalance: c.ticketRevenue + c.otherIncome - c.expenses,
      attendanceRate:
        c.approvedCount > 0 ? Math.round((c.checkedInCount / c.approvedCount) * 100) : 0,
    }))
    .sort((a, b) => b.eventsCount - a.eventsCount || b.registrationsCount - a.registrationsCount);

  const monthlyTrend = Array.from(monthMap.values())
    .filter((m) => m.month !== 'Unknown')
    .sort((a, b) => a.month.localeCompare(b.month));

  const attendanceByEvent = Array.from(eventPerfMap.values())
    .filter((e) => e.registered > 0 || e.approved > 0)
    .map((e) => ({
      ...e,
      attendanceRate: e.approved > 0 ? Math.round((e.checkedIn / e.approved) * 100) : 0,
    }))
    .sort((a, b) => b.approved - a.approved)
    .slice(0, 8);

  const avgPlatformRating =
    feedbacks.length > 0
      ? Number(
          (feedbacks.reduce((s, f) => s + (Number(f.rating) || 0), 0) / feedbacks.length).toFixed(2)
        )
      : 0;

  return {
    summary: {
      totalEvents,
      approvedEvents,
      pendingEvents,
      completedEvents,
      totalRegistrations: registrations.length,
      approvedRegistrations: approvedRegs.length,
      checkedInCount: checkedInRegs.length,
      overallAttendanceRate,
      totalTicketRevenue,
      totalOtherIncomes,
      totalRevenue: totalTicketRevenue + totalOtherIncomes,
      totalExpenses,
      netBalance: totalTicketRevenue + totalOtherIncomes - totalExpenses,
      totalFeedbacks: feedbacks.length,
      avgPlatformRating,
    },
    clubPerformance,
    monthlyTrend,
    attendanceByEvent,
  };
};

