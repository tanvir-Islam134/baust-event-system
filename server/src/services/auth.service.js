import jwt from 'jsonwebtoken';
import { auth as firebaseAuth } from '../config/firebase.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Format standard auth response with issued JWT token and sanitized profile.
 */
const generateAuthResponse = (user, uid) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('Server configuration error: JWT_SECRET missing', 500);
  }

  const tokenPayload = {
    uid: user.id || uid,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return {
    token,
    user: {
      uid: user.id || uid,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || null,
      studentId: user.studentId || null,
      mobileNumber: user.mobileNumber || null,
      clubAffiliation: user.clubAffiliation || null,
      organizerRequestStatus: user.organizerRequestStatus || user.organizerStatus || 'none',
      organizerStatus: user.organizerRequestStatus || user.organizerStatus || 'none',
      batch: user.batch,
      section: user.section,
      level: user.level,
      term: user.term,
    },
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
export const verifyFirebaseTokenAndLogin = async (firebaseToken) => {
  if (!firebaseAuth) {
    throw new AppError('Firebase Auth service is uninitialized on server', 500);
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(firebaseToken);
  } catch (error) {
    throw new AppError(`Firebase token verification failed: ${error.message}`, 401);
  }

  const { uid, email, name: tokenName } = decodedToken;

  if (!email) {
    throw new AppError('Authenticated Firebase account does not have an associated email address', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAdminEmail = normalizedEmail === 'tanvirbaust134@gmail.com';

  // Check if user already exists in Firestore
  let user = await userRepository.findById(uid);

  if (!user) {
    // Upsert new user with extracted name/email and default role 'participant' (or 'admin' for primary admin)
    const finalRole = isAdminEmail ? 'admin' : 'participant';
    const finalName = tokenName || email.split('@')[0] || 'BAUST User';

    user = await userRepository.upsertUser(uid, {
      name: finalName,
      email: normalizedEmail,
      role: finalRole,
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
    // Ensure admin role for tanvirbaust134@gmail.com
    if (isAdminEmail && user.role !== 'admin') {
      user = await userRepository.update(uid, { role: 'admin' });
    }
  }

  return generateAuthResponse(user, uid);
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

  const { uid, email, name: tokenName } = decodedToken;

  if (!email) {
    throw new AppError('Authenticated Firebase account does not have an associated email address', 400);
  }

  const isOrganizerRequested =
    registrationData.accountType === 'Organizer' ||
    registrationData.accountType === 'organizer' ||
    registrationData.requestedRole === 'Organizer' ||
    registrationData.requestedRole === 'organizer';

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

  // Strict condition: if the registering user's email matches tanvirbaust134@gmail.com, assign 'admin' role
  const isAdminEmail = email && email.trim().toLowerCase() === 'tanvirbaust134@gmail.com';
  const finalRole = isAdminEmail ? 'admin' : 'participant'; // Assign 'admin' if match, otherwise default 'participant' (Student)
  const organizerRequestStatus = isOrganizerRequested ? 'pending' : 'none';
  const organizerStatus = isOrganizerRequested ? 'pending' : 'none';
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
  let user = await userRepository.findById(uid);
  if (!user) {
    throw new AppError('User profile not found in database', 404);
  }
  if (user.email && user.email.trim().toLowerCase() === 'tanvirbaust134@gmail.com' && user.role !== 'admin') {
    user = await userRepository.update(uid, { role: 'admin' });
  }
  return user;
};
