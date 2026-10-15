import * as authService from '../services/auth.service.js';

/**
 * Handle Firebase token authentication and custom JWT generation.
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

