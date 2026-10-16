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
 * Service to handle Firebase ID token verification for existing users (Login).
 * Strictly checks if the user exists in the database.
 * If user does NOT exist, returns 404: "Account not found. Please create an account first."
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

  const { uid, email } = decodedToken;

  if (!email) {
    throw new AppError('Authenticated Firebase account does not have an associated email address', 400);
  }

  // Check if user already exists in Firestore
  const user = await userRepository.findById(uid);

  if (!user) {
    throw new AppError('Account not found. Please create an account first.', 404);
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

  const finalRole = 'participant'; // Default base role is Student / participant
  const organizerRequestStatus = isOrganizerRequested ? 'pending' : 'none';
  const organizerStatus = isOrganizerRequested ? 'pending' : 'none';
  const clubAffiliation = isOrganizerRequested ? targetClub.trim() : null;

  // Check if user already exists in Firestore
  let user = await userRepository.findById(uid);

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

  if (!user) {
    user = await userRepository.upsertUser(uid, userPayload);
  } else {
    user = await userRepository.update(uid, userPayload);
  }

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
  return user;
};
