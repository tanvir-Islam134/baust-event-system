/**
 * Utility to detect schedule and venue conflicts among events.
 */

/**
 * Parse a human-readable or 24-hr time string into minutes from midnight.
 * Examples: "10:00 AM" -> 600, "02:30 PM" -> 870, "14:00" -> 840
 * @param {string} timeStr
 * @returns {number} minutes from midnight (0 - 1439)
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 600; // default 10:00 AM
  const clean = timeStr.trim().toUpperCase();

  // 12-hour format with AM/PM: e.g. "10:00 AM", "2:30PM", "12:15 PM"
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10) || 0;
    const meridian = ampmMatch[3];

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // 24-hour format: e.g. "14:30"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10) || 0;
    return hours * 60 + minutes;
  }

  return 600;
};

/**
 * Get normalized start and end minutes for an event.
 * Defaults to 2-hour span if endTime is omitted.
 * @param {object} event
 * @returns {{ start: number, end: number }}
 */
export const getEventTimeInterval = (event) => {
  const start = parseTimeToMinutes(event.startTime || event.time);
  let end = event.endTime ? parseTimeToMinutes(event.endTime) : start + 120;
  if (end <= start) {
    end = start + 120; // 2 hour duration fallback
  }
  return { start, end };
};

/**
 * Normalize date string to YYYY-MM-DD for comparison.
 * @param {string|Date} dateVal
 * @returns {string}
 */
export const normalizeDate = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    // Take first 10 characters if ISO string: "2026-11-20T..."
    return dateVal.trim().slice(0, 10);
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString().slice(0, 10);
  }
  return String(dateVal).trim().slice(0, 10);
};

/**
 * Check if two events overlap in venue or organizer schedule.
 * @param {object} e1
 * @param {object} e2
 * @returns {{ conflict: boolean, reason?: string } | null}
 */
export const checkEventConflict = (e1, e2) => {
  if (e1.id && e2.id && e1.id === e2.id) return null;
  if (e1.status === 'rejected' || e2.status === 'rejected') return null;

  const date1 = normalizeDate(e1.date);
  const date2 = normalizeDate(e2.date);
  if (!date1 || !date2 || date1 !== date2) return null;

  const { start: start1, end: end1 } = getEventTimeInterval(e1);
  const { start: start2, end: end2 } = getEventTimeInterval(e2);
  const timesOverlap = Math.max(start1, start2) < Math.min(end1, end2);

  const venue1 = (e1.venue || '').trim().toLowerCase();
  const venue2 = (e2.venue || '').trim().toLowerCase();
  const sameVenue = venue1.length > 0 && venue2.length > 0 && venue1 === venue2;

  const club1 = (e1.clubName || e1.clubAffiliation || '').trim().toLowerCase();
  const club2 = (e2.clubName || e2.clubAffiliation || '').trim().toLowerCase();
  const sameClub = club1.length > 0 && club2.length > 0 && club1 === club2;

  // Venue booking conflict (same venue with overlapping time slot on same day)
  if (sameVenue && timesOverlap) {
    return {
      conflict: true,
      reason: `Venue overlap at "${e1.venue}" with "${e2.title || e2.eventName}" on ${date1}`,
    };
  }

  // Same venue on same day where explicit non-overlapping window is not assured
  if (sameVenue && (!e1.endTime || !e2.endTime)) {
    return {
      conflict: true,
      reason: `Venue conflict: "${e1.venue}" is simultaneously scheduled for "${e2.title || e2.eventName}" on ${date1}`,
    };
  }

  // Organizer schedule conflict (same club/organizer hosting overlapping events)
  if (sameClub && timesOverlap) {
    return {
      conflict: true,
      reason: `Schedule conflict: Organizer "${e1.clubName || 'Club'}" already has "${e2.title || e2.eventName}" scheduled during this time on ${date1}`,
    };
  }

  return null;
};

/**
 * Computes conflicts against all active events and attaches hasConflict & conflict details.
 * @param {Array<object>} targetEvents - The events being returned to the caller
 * @param {Array<object>} [allActiveEvents=null] - Pool of active events to check against
 * @returns {Array<object>}
 */
export const attachConflictFlags = (targetEvents, allActiveEvents = null) => {
  const pool = allActiveEvents || targetEvents;
  const conflictMap = new Map();

  for (let i = 0; i < pool.length; i++) {
    const e1 = pool[i];
    if (e1.status === 'rejected') continue;

    for (let j = i + 1; j < pool.length; j++) {
      const e2 = pool[j];
      if (e2.status === 'rejected') continue;

      const conflictInfo = checkEventConflict(e1, e2);
      if (conflictInfo && conflictInfo.conflict) {
        if (!conflictMap.has(e1.id)) conflictMap.set(e1.id, []);
        if (!conflictMap.has(e2.id)) conflictMap.set(e2.id, []);

        conflictMap.get(e1.id).push({
          conflictingId: e2.id,
          title: e2.title || e2.eventName || 'Event',
          venue: e2.venue,
          time: e2.time || e2.startTime,
          reason: conflictInfo.reason,
        });

        conflictMap.get(e2.id).push({
          conflictingId: e1.id,
          title: e1.title || e1.eventName || 'Event',
          venue: e1.venue,
          time: e1.time || e1.startTime,
          reason: conflictInfo.reason,
        });
      }
    }
  }

  return targetEvents.map((event) => {
    const conflicts = conflictMap.get(event.id) || [];
    return {
      ...event,
      hasConflict: conflicts.length > 0,
      conflictReasons: conflicts.map((c) => c.reason),
      conflictingWith: conflicts,
    };
  });
};
