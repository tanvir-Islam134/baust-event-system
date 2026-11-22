import jwt from 'jsonwebtoken';
import { auth as firebaseAuth } from '../config/firebase.js';
import { userRepository } from '../repositories/user.repository.js';
import { formatUserResponse } from './user.service.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Format standard auth response with issued JWT token and sanitized profile.
 */
const generateAuthResponse = (user, uid, activeRole = null) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('Server configuration error: JWT_SECRET missing', 500);
  }

  const role = activeRole || user.role || 'participant';
  const tokenPayload = {
    uid: user.id || uid,
    email: user.email,
    role: role,
  };

  const token = jwt.sign(tokenPayload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return {
    token,
    user: formatUserResponse(user, role),
  };
};

/**
 * Service to handle Firebase ID token verification for users (Login).
 * Verifies token via firebase-admin and upserts the user in Firestore:
 * - If user is new: creates profile in Firestore with extracted name/email and default role 'participant'.
 * - If user exists: retrieves existing profile (ensuring admin role if matches admin email).
 * - Generates and returns custom JWT containing uid, email, and role.
 * @param {string} firebaseToken
 */
export const verifyFirebaseTokenAndLogin = async (firebaseToken, options = {}) => {
  if (!firebaseAuth) {
    throw new AppError('Firebase Auth service is uninitialized on server', 500);
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(firebaseToken);
  } catch (error) {
    throw new AppError(`Firebase token verification failed: ${error.message}`, 401);
  }

  const { uid, email, name: tokenName, picture: tokenPicture } = decodedToken;

  if (!email) {
    throw new AppError('Authenticated Firebase account does not have an associated email address', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Parse requested role selection if provided for supervisor/evaluator testing
  let requestedRole = null;
  const rawRole = options.targetRole ? String(options.targetRole).trim().toLowerCase() : null;
  if (rawRole === 'admin' || rawRole === 'hr office') {
    requestedRole = 'admin';
  } else if (rawRole === 'organizer' || rawRole === 'club admin') {
    requestedRole = 'organizer';
  } else if (rawRole === 'participant' || rawRole === 'student') {
    requestedRole = 'participant';
  }

  // Check if user already exists in Firestore
  let user = await userRepository.findById(uid);

  if (!user) {
    // Upsert new user with extracted name/email and selected role (or default 'participant')
    const finalRole = requestedRole || 'participant';
    const finalName = tokenName || email.split('@')[0] || 'BAUST User';
    const isOrganizerRole = finalRole === 'organizer';

    user = await userRepository.upsertUser(uid, {
      name: finalName,
      email: normalizedEmail,
      role: finalRole,
      photoURL: tokenPicture || null,
      department: null,
      studentId: null,
      mobileNumber: null,
      batch: null,
      section: null,
      level: null,
      term: null,
      clubAffiliation: isOrganizerRole ? (options.targetClub || 'CSE Society of BAUST') : null,
      organizerRequestStatus: isOrganizerRole ? 'approved' : 'none',
      organizerStatus: isOrganizerRole ? 'approved' : 'none',
      organizerRejectionReason: null,
    });
  } else {
    const updates = {};
    if (requestedRole) {
      updates.role = requestedRole;
      if (requestedRole === 'organizer') {
        updates.organizerStatus = 'approved';
        updates.organizerRequestStatus = 'approved';
        if (options.targetClub && options.targetClub.trim()) {
          updates.clubAffiliation = options.targetClub.trim();
        } else if (!user.clubAffiliation) {
          updates.clubAffiliation = 'CSE Society of BAUST';
        }
      }
    }
    // If user doesn't have a photoURL yet, populate with Google profile picture
    if (!user.photoURL && tokenPicture) {
      updates.photoURL = tokenPicture;
    }
    if (Object.keys(updates).length > 0) {
      user = await userRepository.update(uid, updates);
    }
  }

  return generateAuthResponse(user, uid);
};

/**
 * Switch authenticated user's role on the fly for project testing/evaluation.
 * Allows supervisor to test Participant, Organizer, and Admin workflows seamlessly.
 * @param {string} userId - Firebase UID
 * @param {string} targetRole - 'participant' | 'organizer' | 'admin'
 * @param {string|null} [targetClub] - Club affiliation for organizer role
 */
export const switchUserRole = async (userId, targetRole, targetClub = null) => {
  let requestedRole = 'participant';
  const raw = targetRole ? String(targetRole).trim().toLowerCase() : 'participant';
  if (raw === 'admin' || raw === 'hr office') {
    requestedRole = 'admin';
  } else if (raw === 'organizer' || raw === 'club admin') {
    requestedRole = 'organizer';
  } else if (raw === 'participant' || raw === 'student') {
    requestedRole = 'participant';
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User profile not found in database', 404);
  }

  const roleProfiles = { ...(user.roleProfiles || {}) };
  const targetRoleProfile = roleProfiles[requestedRole] || {};

  const updates = { 
    role: requestedRole,
    updatedAt: new Date(),
  };

  if (requestedRole === 'organizer') {
    updates.organizerStatus = 'approved';
    updates.organizerRequestStatus = 'approved';
    const assignedClub = (targetClub && targetClub.trim()) || targetRoleProfile.clubAffiliation || user.clubAffiliation || 'CSE Society of BAUST';
    updates.clubAffiliation = assignedClub;
    roleProfiles.organizer = {
      ...targetRoleProfile,
      clubAffiliation: assignedClub,
    };
    updates.roleProfiles = roleProfiles;
  }

  const updatedUser = await userRepository.update(userId, updates);
  return generateAuthResponse(updatedUser, userId, requestedRole);
};

/**
 * Service to handle Firebase ID token verification and user creation (Register).
 * Verifies Firebase token, records student cohort info, handles organizer requests,
 * and creates new user in Firestore database with default base role 'participant'.
 * @param {string} firebaseToken
 * @param {object} registrationData
 */
export const verifyFirebaseTokenAndRegister = async (firebaseToken, registrationData = {}) => {
  if (!firebaseAuth) {
    throw new AppError('Firebase Auth service is uninitialized on server', 500);
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(firebaseToken);
  } catch (error) {
    throw new AppError(`Firebase token verification failed: ${error.message}`, 401);
  }

  const { uid, email, name: tokenName, picture: tokenPicture } = decodedToken;

  if (!email) {
    throw new AppError('Authenticated Firebase account does not have an associated email address', 400);
  }

  // Parse requested role selection from registration data
  const rawRole = (registrationData.role || registrationData.targetRole || registrationData.requestedRole || registrationData.accountType || '').toString().trim().toLowerCase();
  let finalRole = 'participant';
  if (rawRole === 'admin' || rawRole === 'hr office') {
    finalRole = 'admin';
  } else if (rawRole === 'organizer' || rawRole === 'club admin') {
    finalRole = 'organizer';
  }

  const isOrganizerRequested = finalRole === 'organizer' ||
    registrationData.accountType === 'Organizer' ||
    registrationData.accountType === 'organizer' ||
    registrationData.requestedRole === 'Organizer' ||
    registrationData.requestedRole === 'organizer';

  const targetClub =
    registrationData.clubAffiliation ||
    registrationData.clubId ||
    registrationData.club ||
    'CSE Society of BAUST';

  if (isOrganizerRequested && (!targetClub || !targetClub.trim())) {
    throw new AppError('Club selection is required when requesting an Organizer account', 400);
  }

  const finalName = registrationData.name?.trim() || tokenName || email.split('@')[0] || 'BAUST User';
  const finalDepartment = registrationData.department?.trim() || null;
  const finalStudentId = registrationData.studentId?.trim() || null;
  const finalBatch = registrationData.batch?.trim() || null;
  const finalSection = registrationData.section?.trim() || null;
  const finalLevel = registrationData.level !== undefined && registrationData.level !== null ? String(registrationData.level).trim() : null;
  const finalTerm = registrationData.term !== undefined && registrationData.term !== null ? String(registrationData.term).trim() : null;
  const finalMobileNumber = registrationData.mobileNumber?.trim() || null;
  const finalPhotoURL = registrationData.photoURL || tokenPicture || null;

  const organizerRequestStatus = isOrganizerRequested ? 'approved' : 'none';
  const organizerStatus = isOrganizerRequested ? 'approved' : 'none';
  const clubAffiliation = isOrganizerRequested ? targetClub.trim() : null;

  // Check if user already exists in Firestore
  let user = await userRepository.findById(uid);

  if (user) {
    throw new AppError('An account with this email already exists. Please log in.', 409);
  }

  const userPayload = {
    name: finalName,
    email,
    role: finalRole,
    photoURL: finalPhotoURL,
    department: finalDepartment,
    studentId: finalStudentId,
    mobileNumber: finalMobileNumber,
    batch: finalBatch,
    section: finalSection,
    level: finalLevel,
    term: finalTerm,
    clubAffiliation,
    organizerRequestStatus,
    organizerStatus,
    organizerRejectionReason: null,
  };

  user = await userRepository.upsertUser(uid, userPayload);

  return generateAuthResponse(user, uid);
};

/**
 * Retrieve current user profile by UID.
 * @param {string} uid
 */
export const getCurrentUserProfile = async (uid) => {
  const user = await userRepository.findById(uid);
  if (!user) {
    throw new AppError('User profile not found in database', 404);
  }
  return formatUserResponse(user, user.role);
};
