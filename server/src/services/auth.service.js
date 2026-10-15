import jwt from 'jsonwebtoken';
import { auth as firebaseAuth } from '../config/firebase.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Service to handle Firebase ID token verification, user profile synchronization,
 * and custom JWT issuance.
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

  const { uid, email, name } = decodedToken;

  if (!email) {
    throw new AppError('Authenticated Firebase account does not have an associated email address', 400);
  }

  // Check if user already exists in Firestore
  let user = await userRepository.findById(uid);

  if (!user) {
    // Upsert new user profile with default role 'participant'
    user = await userRepository.upsertUser(uid, {
      name: name || email.split('@')[0] || 'BAUST User',
      email,
      role: 'participant',
      batch: null,
      section: null,
      level: null,
      term: null,
      organizerStatus: 'none',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('Server configuration error: JWT_SECRET missing', 500);
  }

  // Issue our own custom JWT containing uid, email, and verified role
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
      organizerStatus: user.organizerStatus,
      batch: user.batch,
      section: user.section,
      level: user.level,
      term: user.term,
    },
  };
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

