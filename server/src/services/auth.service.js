import jwt from 'jsonwebtoken';
import { auth as firebaseAuth } from '../config/firebase.js';
import { userRepository } from '../repositories/user.repository.js';
import { formatUserResponse } from './user.service.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Official administrative accounts with permanent administrative governance.
 * Only these designated accounts receive the 'admin' role automatically.
 */
export const FIXED_ADMIN_EMAILS = [
  '0802420405101134@baust.edu.bd',
  'admin@baust.edu.bd',
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()) : []),
];

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
 * Verifies token via firebase-admin and manages Firestore user profile:
 * - If email belongs to FIXED_ADMIN_EMAILS: always assigns 'admin' role.
 * - If user is new: created strictly with role 'participant'.
 * - If user already exists: retains their assigned database role (e.g., approved 'organizer').
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
  const isAdminEmail = FIXED_ADMIN_EMAILS.includes(normalizedEmail);

  // Check if user already exists in Firestore
  let user = await userRepository.findById(uid);

  if (!user) {
    // New user: Admin email gets 'admin', all other accounts strictly start as 'participant'
    const finalRole = isAdminEmail ? 'admin' : 'participant';
    const finalName = tokenName || email.split('@')[0] || 'BAUST User';

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
      clubAffiliation: null,
      organizerRequestStatus: 'none',
      organizerStatus: 'none',
      organizerRejectionReason: null,
    });
  } else {
    const updates = {};
    // Ensure fixed admin email always has admin role in database
    if (isAdminEmail && user.role !== 'admin') {
      updates.role = 'admin';
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
 * Switch authenticated user's role on the fly.
 * Strictly verifies permissions to prevent unauthorized privilege escalation.
 * @param {string} userId - Firebase UID
 * @param {string} targetRole - 'participant' | 'organizer' | 'admin'
 * @param {string|null} [targetClub] - Club affiliation for organizer role
 */
export const switchUserRole = async (userId, targetRole, targetClub = null) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User profile not found in database', 404);
  }

  const normalizedEmail = (user.email || '').trim().toLowerCase();
  const isAdmin = FIXED_ADMIN_EMAILS.includes(normalizedEmail) || user.role === 'admin';

  let requestedRole = 'participant';
  const rawRole = targetRole ? String(targetRole).trim().toLowerCase() : 'participant';
  if (rawRole === 'admin') {
    if (!isAdmin) {
      throw new AppError('Unauthorized: Admin access is strictly reserved for authorized university accounts.', 403);
    }
    requestedRole = 'admin';
  } else if (rawRole === 'organizer') {
    if (!isAdmin && user.organizerStatus !== 'approved' && user.organizerRequestStatus !== 'approved' && user.role !== 'organizer') {
      throw new AppError('Unauthorized: You must submit an Organizer request and be approved by administration first.', 403);
    }
    requestedRole = 'organizer';
  } else {
    requestedRole = 'participant';
  }

  const updates = { 
    role: requestedRole,
    updatedAt: new Date(),
  };

  if (requestedRole === 'organizer') {
    const assignedClub = (targetClub && targetClub.trim()) || user.clubAffiliation || null;
    if (assignedClub) {
      updates.clubAffiliation = assignedClub;
    }
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

  const normalizedEmail = email.trim().toLowerCase();
  const isAdminEmail = FIXED_ADMIN_EMAILS.includes(normalizedEmail);

  // Fixed admin emails get 'admin', all other accounts strictly start as 'participant'
  const finalRole = isAdminEmail ? 'admin' : 'participant';

  const isOrganizerRequested =
    registrationData.accountType === 'Organizer' ||
    registrationData.accountType === 'organizer' ||
    registrationData.requestedRole === 'Organizer' ||
    registrationData.requestedRole === 'organizer' ||
    registrationData.role === 'organizer';

  const targetClub =
    registrationData.clubAffiliation ||
    registrationData.clubId ||
    registrationData.club ||
    null;

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

  // If admin email: pre-approved. If student requested organizer: pending administrative approval.
  const organizerRequestStatus = isAdminEmail ? 'approved' : (isOrganizerRequested ? 'pending' : 'none');
  const organizerStatus = isAdminEmail ? 'approved' : (isOrganizerRequested ? 'pending' : 'none');
  const clubAffiliation = isOrganizerRequested && targetClub ? targetClub.trim() : null;

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
