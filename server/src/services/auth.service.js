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
 * Verifies Firebase token and creates new user in Firestore database.
 * @param {string} firebaseToken
 */
export const verifyFirebaseTokenAndRegister = async (firebaseToken) => {
  if (!firebaseAuth) {
    throw new AppError('Firebase Auth service is uninitialized on server', 500);
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(firebaseToken);
  } catch (error) {
    throw new AppError(`Firebase token verification failed: ${error.message}`, 401);
  }

  const { uid, email, name } = decodedToken;

  if (!email) {
    throw new AppError('Authenticated Firebase account does not have an associated email address', 400);
  }

  // Check if user already exists in Firestore
  let user = await userRepository.findById(uid);

  if (!user) {
    // Create new user profile with default role 'participant'
    user = await userRepository.upsertUser(uid, {
      name: name || email.split('@')[0] || 'BAUST User',
      email,
      role: 'participant',
      batch: null,
      section: null,
      level: null,
      term: null,
      clubAffiliation: null,
      organizerRequestStatus: 'none',
      organizerStatus: 'none',
    });
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
