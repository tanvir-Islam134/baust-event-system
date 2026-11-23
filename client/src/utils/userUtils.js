/**
 * Utility to verify whether a user's participant profile has all required academic cohort details.
 * A participant must have department, studentId, mobileNumber, batch, section, level, and term filled in.
 * Non-participant roles (organizer, admin) are exempt from student cohort details.
 * 
 * @param {object|null} user - Decoded or API returned user profile
 * @returns {boolean}
 */
export const isParticipantProfileComplete = (user) => {
  if (!user) return false;
  // Non-participant roles (organizer, admin) don't need student cohort requirements
  if (user.role !== 'participant') return true;

  const p = user.roleProfiles?.participant || {};
  const department = p.department || user.department;
  const studentId = p.studentId || user.studentId;
  const mobileNumber = p.mobileNumber || user.mobileNumber;
  const batch = p.batch || user.batch;
  const section = p.section || user.section;
  const level = p.level !== null && p.level !== undefined ? p.level : user.level;
  const term = p.term !== null && p.term !== undefined ? p.term : user.term;

  return Boolean(
    department && String(department).trim() &&
    studentId && String(studentId).trim() &&
    mobileNumber && String(mobileNumber).trim() &&
    batch && String(batch).trim() &&
    section && String(section).trim() &&
    level !== null && level !== undefined && String(level).trim() &&
    term !== null && term !== undefined && String(term).trim()
  );
};
