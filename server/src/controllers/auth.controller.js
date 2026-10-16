import * as authService from '../services/auth.service.js';

/**
 * Handle Firebase token authentication for existing users (Login).
 */
export const login = async (req, res, next) => {
  try {
    const { firebaseToken } = req.body;
    const authData = await authService.verifyFirebaseTokenAndLogin(firebaseToken);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: authData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Firebase token verification and new user creation (Register).
 */
export const register = async (req, res, next) => {
  try {
    const { firebaseToken, ...registrationData } = req.body;
    const authData = await authService.verifyFirebaseTokenAndRegister(firebaseToken, registrationData);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: authData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile.
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUserProfile(req.user.uid);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
