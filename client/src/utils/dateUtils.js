/**
 * Parse a 12-hour ("10:00 AM") or 24-hour ("14:30") time string to minutes from midnight.
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 600;
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 600;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10) || 0;
  const meridian = match[3];
  if (meridian === 'PM' && hours < 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Determine whether an event has officially concluded using status and local date + endTime.
 * Matches server conflictDetector.isEventInPast behavior.
 */
export function isEventConcluded(event) {
  if (!event) return false;
  if (event.status === 'completed') return true;
  if (!event.date) return false;

  try {
    let dateStr = String(event.date).trim().slice(0, 10);
    if (dateStr.startsWith('26444-')) dateStr = dateStr.replace('26444-', '2026-');
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      const parsed = new Date(event.date);
      return !isNaN(parsed.getTime()) && parsed.getTime() < Date.now();
    }

    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;

    const startMins = parseTimeToMinutes(event.startTime || event.time);
    let endMins = event.endTime ? parseTimeToMinutes(event.endTime) : startMins + 120;
    if (endMins <= startMins) endMins = startMins + 120;

    const endHours = Math.floor(endMins / 60);
    const endMinutes = endMins % 60;
    const eventEnd = new Date(y, m - 1, d, endHours, endMinutes, 0, 0);
    return eventEnd.getTime() < Date.now();
  } catch {
    return false;
  }
}
